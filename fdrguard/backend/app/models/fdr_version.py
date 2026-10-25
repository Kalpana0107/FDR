"""
FDRVersion — stores a snapshot per significant FDR state change,
enabling full document version history.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Date
from sqlalchemy.orm import relationship
from ..core.database import Base


class FDRVersion(Base):
    __tablename__ = "fdr_versions"

    id = Column(Integer, primary_key=True, index=True)
    fdr_record_id = Column(Integer, ForeignKey("fdr_records.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)  # monotonically increasing per FDR

    # Snapshot of mutable fields at this version
    fdr_number = Column(String(100), nullable=False)
    bank_name = Column(String(255), nullable=False)
    branch_name = Column(String(255), nullable=True)
    amount = Column(Numeric(15, 2), nullable=False)
    issue_date = Column(Date, nullable=False)
    maturity_date = Column(Date, nullable=False)
    status = Column(String(50), nullable=False)
    remarks = Column(Text, nullable=True)

    # Who made this change
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    diff_summary = Column(Text, nullable=True)   # human-readable change summary
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    fdr_record = relationship("FDRRecord", back_populates="versions")
    changed_by = relationship("User", foreign_keys=[changed_by_id])
