"""
demo_clock.py — in-process demo clock abstraction.

By default get_current_time() returns datetime.now(UTC).
POST /api/v1/admin/demo-clock/fast-forward sets an offset that persists
for the lifetime of the process (sufficient for a hackathon demo).

Production would replace _offset_days with a Redis key.
"""
from datetime import datetime, timezone, timedelta
from threading import Lock

_lock = Lock()
_offset_days: int = 0  # 0 = real time


def get_current_time() -> datetime:
    """Return the demo-adjusted UTC datetime."""
    with _lock:
        return datetime.now(timezone.utc) + timedelta(days=_offset_days)


def fast_forward(days: int) -> dict:
    """
    Advance (or rewind) the demo clock by `days`.
    Pass days=0 and reset=True via the endpoint to restore real time.
    Negative values move the clock backwards.
    Returns the resulting state.
    """
    global _offset_days
    with _lock:
        _offset_days += days
        effective_time = datetime.now(timezone.utc) + timedelta(days=_offset_days)
    return {
        "offset_days": _offset_days,
        "effective_time": effective_time.isoformat(),
        "real_time": datetime.now(timezone.utc).isoformat(),
    }


def reset_clock() -> dict:
    """Reset demo clock to real time."""
    global _offset_days
    with _lock:
        _offset_days = 0
    return {
        "offset_days": 0,
        "effective_time": datetime.now(timezone.utc).isoformat(),
        "real_time": datetime.now(timezone.utc).isoformat(),
    }


def get_clock_state() -> dict:
    with _lock:
        effective = datetime.now(timezone.utc) + timedelta(days=_offset_days)
    return {
        "offset_days": _offset_days,
        "effective_time": effective.isoformat(),
        "real_time": datetime.now(timezone.utc).isoformat(),
    }
