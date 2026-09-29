"""
Core package: Configuration, Database sessions, and Security/Auth primitives.
"""
from core.config import settings
from core.database import Base, engine, AsyncSessionLocal, get_db, init_db
from core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    get_current_user,
    require_role,
)

__all__ = [
    "settings",
    "Base",
    "engine",
    "AsyncSessionLocal",
    "get_db",
    "init_db",
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "decode_access_token",
    "get_current_user",
    "require_role",
]
