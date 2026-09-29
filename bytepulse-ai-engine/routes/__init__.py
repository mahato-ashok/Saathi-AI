"""
Routes package: Modular FastAPI APIRouters.
"""
from routes.auth_routes import router as auth_router
from routes.beneficiary_routes import router as beneficiary_router
from routes.counsellor_routes import router as counsellor_router
from routes.ai_routes import router as ai_router
from routes.health_routes import router as health_router

__all__ = [
    "auth_router",
    "beneficiary_router",
    "counsellor_router",
    "ai_router",
    "health_router",
]
