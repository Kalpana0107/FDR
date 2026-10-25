"""
Alembic environment configuration for FDRGuard.
Uses SQLAlchemy models from app.models and connection settings from app.core.config.
"""
import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# ── path setup ────────────────────────────────────────────────────────────────
# Ensure the project root (backend/) is on sys.path so we can import app.*
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── import all models so Alembic sees them in Base.metadata ───────────────────
from app.core.database import Base  # noqa: F401
from app.models import (  # noqa: F401
    User, Institution, FDRRecord, Document, StatusHistory, AuditEvent
)
from app.core.config import settings

# ── Alembic Config ────────────────────────────────────────────────────────────
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata — must include all tables we want Alembic to manage
target_metadata = Base.metadata


def get_url() -> str:
    # Allow override via SQLALCHEMY_URL env var (useful for migrations on CI)
    return os.getenv("SQLALCHEMY_URL", settings.DATABASE_URL)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine,
    though an Engine is acceptable here as well.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connected to a live database)."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
