"""Test-session records, folder queue, timings and session hosting estimates."""
from dataclasses import asdict, dataclass
from datetime import date, datetime, timezone
from pathlib import Path
import math

@dataclass(frozen=True)
class Rates:
    hourly_usd: float
    def __post_init__(self):
        if not math.isfinite(self.hourly_usd) or self.hourly_usd < 0:
            raise ValueError('Hourly rate must be finite and nonnegative.')

def default_rates(model=None):
    return None

def estimate_cost(usage, rates):
    return None  # Hosting is elapsed session time, not a charge per image.

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
        self.started = __import__('time').monotonic()
        self.rate = None
        self.cost = 0.0
        self.cost_updated = self.started
        self.unknown_seconds = 0.0

    def record(self, filename, result, rates, error=None, source='single', model=None):
        result = result or {}
        entry = {'id': len(self.records) + 1,
                 'timestamp_utc': datetime.now(timezone.utc).isoformat(),
                 'image_filename': str(filename), 'source': source,
                 'status': 'error' if error else 'analyzed', 'grade': None,
                 'error': error, 'result': result,
                 'model': result.get('model', model),
                 'hosting_rate_at_request': asdict(rates) if rates else None}
        self.records.append(entry)
        return entry

    def grade(self, entry, grade):
        if grade not in ('Pass', 'Fail', 'Close'):
            raise ValueError('Invalid grade.')
        if not any(r is entry for r in self.records) or entry['status'] != 'analyzed' or entry['grade'] is not None:
            raise ValueError('This result cannot be graded again.')
        entry['grade'] = grade

    def totals(self):
        return {'lookups': sum((r['result'].get('usage') or {}).get('lookups',0) for r in self.records),
                'analyzed': sum(r['status'] == 'analyzed' for r in self.records),
                'pass': sum(r['grade'] == 'Pass' for r in self.records),
                'fail': sum(r['grade'] == 'Fail' for r in self.records),
                'close': sum(r['grade'] == 'Close' for r in self.records),
                'ungraded': sum(r['status'] == 'analyzed' and r['grade'] is None for r in self.records),
                'errors': sum(r['status'] == 'error' for r in self.records)}

    def set_rate(self, rate):
        self.hosting()
        self.rate = rate

    def hosting(self):
        now = __import__('time').monotonic()
        delta = now - self.cost_updated
        if self.rate is None: self.unknown_seconds += delta
        else: self.cost += delta * self.rate.hourly_usd / 3600
        self.cost_updated = now
        return {'session_elapsed_seconds': now-self.started,
                'estimated_hosting_usd': self.cost,
                'unpriced_seconds': self.unknown_seconds}

    def timing(self):
        values = [r['result']['elapsed_seconds'] for r in self.records
                  if r['status']=='analyzed' and isinstance(r['result'].get('elapsed_seconds'),(int,float))]
        return {'count':len(values), 'average':sum(values)/len(values) if values else None,
                'fastest':min(values) if values else None, 'slowest':max(values) if values else None}
