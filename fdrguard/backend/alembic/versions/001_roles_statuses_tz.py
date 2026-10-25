"""Add new UserRole and FDRStatus values; timezone-aware datetimes

Revision ID: 001_roles_statuses_tz
Revises:
Create Date: 2026-10-25

Changes:
  - UserRole enum: add COLLEGE, OFFICER, BANK_VERIFIER, APPROVER, MANAGEMENT
  - FDRStatus enum: rename values to title-case (Submitted, Under Review, etc.)
    and add Active, Maturing, Renewed, Release in Progress, Released, Withdrawn
  - All DateTime columns: add timezone=True
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "001_roles_statuses_tz"
down_revision = None
branch_labels = None
depends_on = None


# New enum values for SQLite-compatible migration
# (SQLite doesn't enforce enum constraints, so we just redefine the columns)
NEW_USER_ROLES = (
    "college_user", "college", "officer", "bank_verifier",
    "approver", "management", "admin",
)

NEW_FDR_STATUSES = (
    "draft",
    "Submitted",
    "Under Review",
    "Verified",
    "Active",
    "Maturing",
    "Returned",
    "Rejected",
    "Renewed",
    "Release in Progress",
    "Released",
    "Withdrawn",
)


def upgrade() -> None:
    """
    For PostgreSQL: ALTER TYPE to add new enum values, then migrate old data.
    For SQLite (dev/test): recreate tables with new column definitions.
    """
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        _upgrade_postgres(bind)
    else:
        # SQLite: alter columns (SQLite allows VARCHAR-backed enums)
        _upgrade_sqlite_generic(bind)


def downgrade() -> None:
    """Remove new enum values. Data using new values will be lost."""
    bind = op.get_bind()
    dialect = bind.dialect.name
    if dialect == "postgresql":
        _downgrade_postgres(bind)
    # SQLite: no-op (SQLite doesn't enforce enum values)


def _upgrade_postgres(bind) -> None:
    # ── UserRole ──────────────────────────────────────────────────────────────
    new_user_role_values = ["college", "officer", "bank_verifier", "approver", "management"]
    for val in new_user_role_values:
        bind.execute(
            sa.text(f"ALTER TYPE userrole ADD VALUE IF NOT EXISTS '{val}'")
        )

    # ── FDRStatus: add new values ─────────────────────────────────────────────
    # Old values: draft, submitted, under_review, returned, verified, rejected
    # New values: Submitted, Under Review, Verified, Active, Maturing, Returned,
    #             Rejected, Renewed, Release in Progress, Released, Withdrawn
    new_status_values = [
        "Submitted", "Under Review", "Verified", "Active", "Maturing",
        "Returned", "Rejected", "Renewed", "Release in Progress", "Released", "Withdrawn",
    ]
    for val in new_status_values:
        bind.execute(
            sa.text(f"ALTER TYPE fdrstatus ADD VALUE IF NOT EXISTS '{val}'")
        )

    # Migrate existing data: old lowercase → new title-case values
    migration_map = {
        "submitted": "Submitted",
        "under_review": "Under Review",
        "verified": "Verified",
        "returned": "Returned",
        "rejected": "Rejected",
    }
    for old, new in migration_map.items():
        bind.execute(
            sa.text(
                "UPDATE fdr_records SET status = :new WHERE status = :old"
            ).bindparams(new=new, old=old)
        )
        bind.execute(
            sa.text(
                "UPDATE statushistory SET from_status = :new WHERE from_status = :old"
            ).bindparams(new=new, old=old)
        )
        bind.execute(
            sa.text(
                "UPDATE statushistory SET to_status = :new WHERE to_status = :old"
            ).bindparams(new=new, old=old)
        )

    # ── DateTime: add timezone awareness ─────────────────────────────────────
    for table, col in [
        ("users", "created_at"), ("users", "updated_at"),
        ("fdr_records", "created_at"), ("fdr_records", "updated_at"), ("fdr_records", "submitted_at"),
        ("statushistory", "created_at"),
        ("auditevents", "created_at"),
    ]:
        op.alter_column(
            table, col,
            type_=sa.DateTime(timezone=True),
            existing_type=sa.DateTime(timezone=False),
            existing_nullable=True,
        )


def _upgrade_sqlite_generic(bind) -> None:
    # SQLite doesn't enforce enum values; the column is stored as VARCHAR.
    # We only need to migrate the data (old lowercase → new title-case).
    migration_map = {
        "submitted": "Submitted",
        "under_review": "Under Review",
        "verified": "Verified",
        "returned": "Returned",
        "rejected": "Rejected",
    }
    for table in ("fdr_records",):
        for old, new in migration_map.items():
            bind.execute(
                sa.text(f"UPDATE {table} SET status = :new WHERE status = :old").bindparams(new=new, old=old)
            )

    for old, new in migration_map.items():
        for col in ("from_status", "to_status"):
            try:
                bind.execute(
                    sa.text(f"UPDATE statushistory SET {col} = :new WHERE {col} = :old").bindparams(new=new, old=old)
                )
            except Exception:
                pass  # table may not exist yet


def _downgrade_postgres(bind) -> None:
    # Migrate data back before removing enum values
    migration_map = {
        "Submitted": "submitted",
        "Under Review": "under_review",
        "Verified": "verified",
        "Returned": "returned",
        "Rejected": "rejected",
    }
    for new, old in migration_map.items():
        bind.execute(
            sa.text("UPDATE fdr_records SET status = :old WHERE status = :new").bindparams(old=old, new=new)
        )
    # Note: PostgreSQL doesn't support DROP VALUE from enum — manual intervention required
