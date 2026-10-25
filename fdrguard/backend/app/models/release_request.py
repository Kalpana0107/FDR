"""
ReleaseRequest — two-person (maker-checker) dual-control release workflow.

State machine:
  PENDING → REQUESTED → APPROVED | REJECTED

Constraints enforced in service layer:
  - requester_id != approver_id
  - approver_id != fdr.submitted_by_id  (creator cannot approve)
"""
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from ..core.database import Base


class ReleaseStatus(str, enum.Enum):
    PENDING = "PENDING"
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ReleaseRequest(Base):
    __tablename__ = "release_requests"

    id = Column(Integer, primary_key=True, index=True)
    fdr_record_id = Column(Integer, ForeignKey("fdr_records.id"), nullable=False, index=True)

    status = Column(SAEnum(ReleaseStatus), nullable=False, default=ReleaseStatus.REQUESTED)
    reason = Column(Text, nullable=True)

    # Maker
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Checker
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    decision_at = Column(DateTime(timezone=True), nullable=True)
    decision_remark = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    fdr_record = relationship("FDRRecord", back_populates="release_requests")
    requester = relationship("User", foreign_keys=[requester_id])
    approver = relationship("User", foreign_keys=[approver_id])
