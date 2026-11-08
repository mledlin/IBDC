"""Test-session records, folder queue, and explicit token-based cost estimates."""
from dataclasses import asdict, dataclass
from datetime import date, datetime, timezone
from pathlib import Path
import math

@dataclass(frozen=True)
class Rates:
    input: float
    output: float
    cached: float

    def __post_init__(self):
        if any(not math.isfinite(v) or v < 0 for v in (self.input, self.output, self.cached)):
            raise ValueError('Rates must be finite, nonnegative USD amounts per million tokens.')


def default_rates(model, today=None):
    if model != 'gemini-3.8-flash':
        return None
    factor = 1 if (today or date.today()) < date(2027, 1, 1) else 2
    return Rates(.75 * factor, 3.75 * factor, .075 * factor)


def estimate_cost(usage, rates):
    """No tools or explicit cache storage are used. Include billed thinking tokens."""
    if rates is None or not isinstance(usage, dict) or 'promptTokenCount' not in usage:
        return None
    counts = [usage.get(k, 0) for k in ('promptTokenCount', 'candidatesTokenCount',
                                      'thoughtsTokenCount', 'cachedContentTokenCount')]
    if any(type(n) is not int or n < 0 for n in counts):
        return None
    prompt, candidates, thoughts, cached = counts
    if cached > prompt:
        return None
    return ((prompt - cached) * rates.input + cached * rates.cached +
            (candidates + thoughts) * rates.output) / 1_000_000


def folder_images(folder):
    """Immediate folder only, deterministic case-insensitive filename ordering."""
    return sorted((p for p in Path(folder).iterdir() if p.is_file() and
                   p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}),
                  key=lambda p: (p.name.casefold(), p.name))


class Batch:
    def __init__(self):
        self.paths = []; self.index = 0; self.active = False

    def start(self, paths):
        if not paths:
            raise ValueError('No supported images in this folder.')
        self.paths = list(paths); self.index = 0; self.active = True

    @property
    def current(self):
        return self.paths[self.index] if self.active else None

    @property
    def position(self):
        return f'{self.index + 1} of {len(self.paths)}'

    def advance(self):
        if not self.active:
            return None
        self.index += 1
        if self.index >= len(self.paths):
            self.active = False
            return None
        return self.current

    def cancel(self):
        self.active = False


class Session:
    def __init__(self):
        self.records = []

    def record(self, filename, result, rates, error=None, source='single', model=None):
        result = result or {}
        entry = {'id': len(self.records) + 1,
                 'timestamp_utc': datetime.now(timezone.utc).isoformat(),
                 'image_filename': str(filename), 'source': source,
                 'status': 'error' if error else 'analyzed', 'grade': None,
                 'error': error, 'result': result,
                 'model': result.get('model', model),
                 'rates_usd_per_million': asdict(rates) if rates else None,
                 'estimated_cost_usd': estimate_cost(result.get('usage'), rates)}
        self.records.append(entry)
        return entry

    def grade(self, entry, grade):
        if grade not in ('Pass', 'Fail', 'Close'):
            raise ValueError('Invalid grade.')
        if not any(r is entry for r in self.records) or entry['status'] != 'analyzed' or entry['grade'] is not None:
            raise ValueError('This result cannot be graded again.')
        entry['grade'] = grade

    def totals(self):
        return {'analyzed': sum(r['status'] == 'analyzed' for r in self.records),
                'pass': sum(r['grade'] == 'Pass' for r in self.records),
                'fail': sum(r['grade'] == 'Fail' for r in self.records),
                'close': sum(r['grade'] == 'Close' for r in self.records),
                'ungraded': sum(r['status'] == 'analyzed' and r['grade'] is None for r in self.records),
                'errors': sum(r['status'] == 'error' for r in self.records),
                'estimated_cost_usd': sum(r['estimated_cost_usd'] or 0 for r in self.records),
                'unknown_cost_requests': sum(r['estimated_cost_usd'] is None for r in self.records)}
