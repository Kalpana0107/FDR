"""
Demo clock endpoints (admin only).

GET  /api/v1/admin/demo-clock          – current state
POST /api/v1/admin/demo-clock/fast-forward  – jump N days
POST /api/v1/admin/demo-clock/reset    – reset to real time

POST /api/v1/reminders/trigger-check   – evaluate maturity milestones (admin)
"""
from datetime import timedelta
from typing import List

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session, joinedload

from ..core.database import get_db
from ..core.deps import get_current_admin
from ..models.user import User
from ..models.fdr import FDRRecord, FDRStatus
from ..models.maturity_reminder import MaturityReminder
from ..schemas.analytics import ReminderOut
from ..services import demo_clock

admin_router = APIRouter(prefix="/v1/admin", tags=["Demo Clock"])
reminder_router = APIRouter(prefix="/v1/reminders", tags=["Maturity Reminders"])

MILESTONES = [90, 60, 30]


# ── Demo clock ────────────────────────────────────────────────────────────────

@admin_router.get("/demo-clock")
def get_clock_state(_: User = Depends(get_current_admin)):
    return demo_clock.get_clock_state()


@admin_router.post("/demo-clock/fast-forward")
def fast_forward(
    days: int = Body(..., embed=True, description="Number of days to advance (negative to rewind)"),
    _: User = Depends(get_current_admin),
):
    if days == 0:
        return demo_clock.get_clock_state()
    return demo_clock.fast_forward(days)


@admin_router.post("/demo-clock/reset")
def reset_clock(_: User = Depends(get_current_admin)):
    return demo_clock.reset_clock()


# ── Reminder trigger ──────────────────────────────────────────────────────────

@reminder_router.post("/trigger-check", response_model=List[ReminderOut])
def trigger_reminder_check(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Evaluate all Active / Maturing FDRs against the demo clock.
    For each FDR that crosses a 90/60/30-day threshold:
      - Records a MaturityReminder row (unique constraint prevents duplicates).
      - Returns all generated + already-sent reminders for this run.
    """
    now = demo_clock.get_current_time()
    offset = demo_clock._offset_days

    active_fdrs = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution)
    ).filter(FDRRecord.status.in_([FDRStatus.ACTIVE, FDRStatus.MATURING])).all()

    results: List[ReminderOut] = []

    for fdr in active_fdrs:
        days_remaining = (fdr.maturity_date - now.date()).days
        for milestone in MILESTONES:
            if days_remaining <= milestone:
                already_sent = False
                # Check for existing reminder
                existing = db.query(MaturityReminder).filter(
                    MaturityReminder.fdr_record_id == fdr.id,
                    MaturityReminder.milestone == str(milestone),
                ).first()
                if not existing:
                    reminder = MaturityReminder(
                        fdr_record_id=fdr.id,
                        milestone=str(milestone),
                        demo_clock_offset_days=offset,
                    )
                    db.add(reminder)
                    try:
                        db.flush()
                    except Exception:
                        db.rollback()
                        already_sent = True
                else:
                    already_sent = True

                institution_name = fdr.institution.name if fdr.institution else None
                results.append(ReminderOut(
                    fdr_record_id=fdr.id,
                    fdr_number=fdr.fdr_number,
                    milestone=str(milestone),
                    days_remaining=days_remaining,
                    maturity_date=fdr.maturity_date.isoformat(),
                    institution_name=institution_name,
                    triggered_at=now.isoformat(),
                    already_sent=already_sent,
                ))

    db.commit()
    return results
