"""
Hash-chained AuditLog model.

Each entry stores SHA-256(previous_hash + timestamp_iso + action + str(actor_id) + payload_snapshot).
The genesis entry has previous_hash = '0' * 64.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    action = Column(String(120), nullable=False, index=True)

    # Actor — nullable so system events work
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_role = Column(String(50), nullable=True)

    # Target record
    record_id = Column(Integer, nullable=True, index=True)
    record_type = Column(String(80), nullable=True)  # e.g. "FDRRecord", "ReleaseRequest"

    payload_snapshot = Column(Text, nullable=True)   # JSON string
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, unique=True, index=True)

    # Relationship (no back_populates on User to keep model minimal)
    actor = relationship("User", foreign_keys=[actor_id])
