"""
conftest.py — sets DATABASE_URL to SQLite BEFORE any app module is imported.

This is required because app/core/database.py calls create_engine() at
module load time. Setting the env var here (top of conftest, before any
imports) intercepts that call.
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_fdrguard.db")
os.environ.setdefault("ENV", "dev")
