"""
BankVerification — persists each simulated CBS check result.
"""
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import relationship
from ..core.database import Base


class BankCheckStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"
    VERIFICATION_PENDING = "VERIFICATION_PENDING"


class BankVerification(Base):
    __tablename__ = "bank_verifications"

    id = Column(Integer, primary_key=True, index=True)
    fdr_record_id = Column(Integer, ForeignKey("fdr_records.id"), nullable=False, index=True)

    result = Column(SAEnum(BankCheckStatus), nullable=False)
    simulated = Column(Boolean, nullable=False, default=True)  # always True in prototype

    # Submitted vs. bank values recorded as JSON strings for diff storage
    submitted_snapshot = Column(Text, nullable=True)
    bank_snapshot = Column(Text, nullable=True)
    discrepancies = Column(Text, nullable=True)  # JSON list of differing field names
    bank_ref = Column(String(80), nullable=True)  # CBS reference ID

    # Retry metadata (used when result == VERIFICATION_PENDING)
    retry_after_seconds = Column(Integer, nullable=True)
    outage_reason = Column(String(255), nullable=True)

    checked_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    checked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    fdr_record = relationship("FDRRecord", back_populates="bank_verifications")
    checked_by = relationship("User", foreign_keys=[checked_by_id])
