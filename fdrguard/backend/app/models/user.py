import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..core.database import Base


class UserRole(str, enum.Enum):
    COLLEGE_USER = "college_user"
    COLLEGE = "college"
    OFFICER = "officer"
    BANK_VERIFIER = "bank_verifier"
    APPROVER = "approver"
    MANAGEMENT = "management"
    # Legacy alias — ADMIN maps to OFFICER in logic
    ADMIN = "admin"


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.COLLEGE_USER)
    is_active = Column(Boolean, default=True, nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Relationships
    institution = relationship("Institution", back_populates="users")
    fdr_records = relationship("FDRRecord", back_populates="submitted_by_user", foreign_keys="FDRRecord.submitted_by_id")
    status_transitions = relationship("StatusHistory", back_populates="actor")
    audit_events = relationship("AuditEvent", back_populates="actor")
