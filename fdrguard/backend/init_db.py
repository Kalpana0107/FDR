"""
Database initialization script — creates all tables from SQLAlchemy models.
Run this instead of Alembic for Stage 1 simplicity.
Usage: python init_db.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine, Base
from app.models import (
    User, UserRole,
    Institution,
    FDRRecord, FDRStatus,
    Document,
    StatusHistory, AuditEvent,
    # New models — must be imported so Base.metadata registers their tables
    AuditLog,
    BankVerification, BankCheckStatus,
    FDRVersion,
    MaturityReminder,
    ReleaseRequest, ReleaseStatus,
)


def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully.")


if __name__ == "__main__":
    init_db()
