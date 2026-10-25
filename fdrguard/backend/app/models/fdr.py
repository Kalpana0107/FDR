import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Enum, ForeignKey,
    Text, Numeric, Date, Index
)
from sqlalchemy.orm import relationship
from ..core.database import Base


class FDRStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    RETURNED = "returned"
    VERIFIED = "verified"
    REJECTED = "rejected"


class FDRRecord(Base):
    __tablename__ = "fdr_records"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(30), unique=True, nullable=False, index=True)

    # Owning institution
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    submitted_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # FDR details
    fdr_number = Column(String(100), nullable=False)
    bank_name = Column(String(255), nullable=False)
    branch_name = Column(String(255), nullable=True)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    issue_date = Column(Date, nullable=False)
    maturity_date = Column(Date, nullable=False)
    purpose = Column(String(512), nullable=False)
    remarks = Column(Text, nullable=True)

    # Workflow
    status = Column(Enum(FDRStatus), nullable=False, default=FDRStatus.DRAFT)
    admin_remark = Column(Text, nullable=True)  # Latest remark from admin

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)

    # Relationships
    institution = relationship("Institution", back_populates="fdr_records")
    submitted_by_user = relationship("User", back_populates="fdr_records", foreign_keys=[submitted_by_id])
    documents = relationship("Document", back_populates="fdr_record", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="fdr_record", order_by="StatusHistory.created_at")
    audit_events = relationship("AuditEvent", back_populates="fdr_record")

    __table_args__ = (
        Index("ix_fdr_institution_status", "institution_id", "status"),
        Index("ix_fdr_status", "status"),
        Index("ix_fdr_maturity_date", "maturity_date"),
    )
