"""Test-session records, folder queue, and allocated subscription cost estimates."""
from dataclasses import asdict, dataclass
from datetime import date, datetime, timezone
from pathlib import Path
import math

@dataclass(frozen=True)
class Rates:
    monthly_fee: float
    included_lookups: int

    def __post_init__(self):
        if not math.isfinite(self.monthly_fee) or self.monthly_fee < 0:
            raise ValueError('Monthly fee must be a finite, nonnegative USD amount.')
        if type(self.included_lookups) is not int or self.included_lookups <= 0:
            raise ValueError('Included lookups must be a positive whole number.')


def default_rates(model=None):
    return Rates(50,50000)


def estimate_cost(usage,rates):
    if rates is None or not isinstance(usage,dict):return None
    n=usage.get('lookups')
    if type(n) is not int or n < 0:return None
    return n * rates.monthly_fee / rates.included_lookups


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
                 'subscription_allocation': asdict(rates) if rates else None,
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
        return {'lookups': sum((r['result'].get('usage') or {}).get('lookups',0) for r in self.records),
                'analyzed': sum(r['status'] == 'analyzed' for r in self.records),
                'pass': sum(r['grade'] == 'Pass' for r in self.records),
                'fail': sum(r['grade'] == 'Fail' for r in self.records),
                'close': sum(r['grade'] == 'Close' for r in self.records),
                'ungraded': sum(r['status'] == 'analyzed' and r['grade'] is None for r in self.records),
                'errors': sum(r['status'] == 'error' for r in self.records),
                'estimated_cost_usd': sum(r['estimated_cost_usd'] or 0 for r in self.records),
                'unknown_cost_requests': sum(r['estimated_cost_usd'] is None for r in self.records)}
