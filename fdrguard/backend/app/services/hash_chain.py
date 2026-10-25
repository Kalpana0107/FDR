"""
hash_chain.py — SHA-256 hash-chained audit log helpers.

Each AuditLog entry's current_hash is computed as:
    SHA256(previous_hash + timestamp_iso + action + str(actor_id) + payload_snapshot)

The genesis entry's previous_hash is '0' * 64.

All DB writes are atomic: the lock is held for the SELECT of the last entry
and the INSERT of the new entry within the same transaction.
"""
import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.audit_log import AuditLog


GENESIS_HASH = "0" * 64


def _compute_hash(previous_hash: str, timestamp_iso: str, action: str,
                  actor_id: str, payload_snapshot: str) -> str:
    raw = f"{previous_hash}{timestamp_iso}{action}{actor_id}{payload_snapshot}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def append_audit_log(
    db: Session,
    action: str,
    actor_id: Optional[int] = None,
    actor_role: Optional[str] = None,
    record_id: Optional[int] = None,
    record_type: Optional[str] = None,
    payload: Optional[dict[str, Any]] = None,
) -> AuditLog:
    """
    Atomically append a new chained entry.

    Locks the last row with SELECT FOR UPDATE (PostgreSQL) so concurrent
    writers cannot produce a forked chain. Falls back gracefully on SQLite.
    """
    payload_snapshot = json.dumps(payload or {}, sort_keys=True, default=str)
    now = datetime.now(timezone.utc)
    timestamp_iso = now.isoformat()

    # Find the last entry — use with_for_update() for PG; SQLite ignores it.
    stmt = select(AuditLog).order_by(AuditLog.id.desc()).limit(1).with_for_update()
    last_entry = db.execute(stmt).scalars().first()
    previous_hash = last_entry.current_hash if last_entry else GENESIS_HASH

    current_hash = _compute_hash(
        previous_hash,
        timestamp_iso,
        action,
        str(actor_id) if actor_id is not None else "",
        payload_snapshot,
    )

    entry = AuditLog(
        timestamp=now,
        action=action,
        actor_id=actor_id,
        actor_role=actor_role,
        record_id=record_id,
        record_type=record_type,
        payload_snapshot=payload_snapshot,
        previous_hash=previous_hash,
        current_hash=current_hash,
    )
    db.add(entry)
    db.flush()   # caller should commit
    return entry


def verify_chain(db: Session) -> dict:
    """
    Traverse all AuditLog entries in insertion order, recompute each hash,
    and check that prev_hash linkage is intact.

    Returns:
        {
          "is_valid": bool,
          "total_records": int,
          "broken_at_id": int | None,
          "details": str,
        }
    """
    entries = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    total = len(entries)

    if total == 0:
        return {
            "is_valid": True,
            "total_records": 0,
            "broken_at_id": None,
            "details": "Chain is empty — no audit entries yet.",
        }

    expected_previous = GENESIS_HASH

    for entry in entries:
        # 1. previous_hash linkage check
        if entry.previous_hash != expected_previous:
            return {
                "is_valid": False,
                "total_records": total,
                "broken_at_id": entry.id,
                "details": f"Previous-hash linkage broken at record {entry.id}.",
            }

        # 2. Re-compute and compare current_hash
        recomputed = _compute_hash(
            entry.previous_hash,
            entry.timestamp.isoformat(),
            entry.action,
            str(entry.actor_id) if entry.actor_id is not None else "",
            entry.payload_snapshot or "{}",
        )
        if recomputed != entry.current_hash:
            return {
                "is_valid": False,
                "total_records": total,
                "broken_at_id": entry.id,
                "details": f"Hash mismatch at record {entry.id}.",
            }

        expected_previous = entry.current_hash

    return {
        "is_valid": True,
        "total_records": total,
        "broken_at_id": None,
        "details": "Chain integrity intact.",
    }
