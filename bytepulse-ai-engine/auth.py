"""
auth.py — Backward-compatibility wrapper. Delegates to core.security.
"""
from core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    decode_token,
    get_current_user,
    require_role,
    oauth2_scheme,
)
from core.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

__all__ = [
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "decode_access_token",
    "decode_token",
    "get_current_user",
    "require_role",
    "oauth2_scheme",
    "SECRET_KEY",
    "ALGORITHM",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
]
