"""
MaturityReminder — tracks which milestone (90/60/30-day) alerts have
been sent for each FDR so duplicates are never generated.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from ..core.database import Base


class MaturityReminder(Base):
    __tablename__ = "maturity_reminders"

    id = Column(Integer, primary_key=True, index=True)
    fdr_record_id = Column(Integer, ForeignKey("fdr_records.id"), nullable=False, index=True)

    # milestone: "90", "60", or "30" (days remaining)
    milestone = Column(String(10), nullable=False)

    triggered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    demo_clock_offset_days = Column(Integer, nullable=True)  # for audit: what clock was active

    fdr_record = relationship("FDRRecord")

    __table_args__ = (
        # One reminder per FDR per milestone — prevents duplicates
        UniqueConstraint("fdr_record_id", "milestone", name="uq_fdr_milestone"),
    )
