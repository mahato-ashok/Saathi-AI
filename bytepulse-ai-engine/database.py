"""
database.py — Backward-compatibility wrapper. Delegates to core.database.
"""
from core.database import (
    engine,
    AsyncSessionLocal,
    Base,
    get_db,
    init_db,
)

__all__ = [
    "engine",
    "AsyncSessionLocal",
    "Base",
    "get_db",
    "init_db",
]
