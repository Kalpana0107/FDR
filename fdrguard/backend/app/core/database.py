import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings


def _build_engine():
    url = settings.DATABASE_URL
    # SQLite (used in tests) doesn't support pool_size / max_overflow
    if url.startswith("sqlite"):
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
        )
    try:
        eng = create_engine(
            url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 2},
        )
        with eng.connect():
            pass
        return eng
    except Exception:
        # Fall back to local SQLite when local PostgreSQL service is not running
        fallback_url = "sqlite:///./fdrguard.db"
        return create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
        )


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
