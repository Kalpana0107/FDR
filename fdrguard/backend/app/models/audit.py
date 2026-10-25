from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from ..core.database import Base
from .fdr import FDRStatus


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    fdr_record_id = Column(Integer, ForeignKey("fdr_records.id"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    from_status = Column(Enum(FDRStatus), nullable=True)
    to_status = Column(Enum(FDRStatus), nullable=False)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    fdr_record = relationship("FDRRecord", back_populates="status_history")
    actor = relationship("User", back_populates="status_transitions")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    fdr_record_id = Column(Integer, ForeignKey("fdr_records.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    metadata_json = Column(Text, nullable=True)  # JSON string for additional context
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    actor = relationship("User", back_populates="audit_events")
    fdr_record = relationship("FDRRecord", back_populates="audit_events")
