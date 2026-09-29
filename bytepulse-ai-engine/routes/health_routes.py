"""
routes/health_routes.py — Root, Health Check & Status Endpoints
"""
from fastapi import APIRouter
from core.config import settings

router = APIRouter(tags=["System & Health"])


@router.get("/")
def root():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "features": ["PostgreSQL", "JWT Auth", "Role-Based Access Control", "Google Gemini", "DistilRoBERTa"],
        "ai_engine": {
            "conversational_llm": "Google Gemini",
            "active_model": settings.PRIMARY_GEMINI_MODEL,
            "behavioral_model": "Isolation Forest",
            "emotion_classifier": "DistilRoBERTa (j-hartmann)"
        },
        "endpoints": {
            "auth": "/auth/register | /auth/login | /auth/me",
            "beneficiary": "/beneficiary/checkins | /beneficiary/my-case | /beneficiary/chat-history",
            "counsellor": "/counsellor/cases | /counsellor/cases/{ref} | /counsellor/alerts | /counsellor/stats",
            "ai": "/predict | /chat | /counsellor/ai-summary",
            "health": "/health",
            "docs": "/docs"
        }
    }


@router.get("/health")
def health():
    return {
        "status": "ok",
        "engine": "BytePulse",
        "version": settings.VERSION,
        "ai_provider": "Google Gemini",
        "gemini_model": settings.PRIMARY_GEMINI_MODEL,
        "gemini_active": bool(settings.GEMINI_API_KEY),
        "database": "PostgreSQL (asyncpg)",
        "auth": f"JWT ({settings.ALGORITHM})",
    }


@router.get("/gemini-status")
def gemini_status():
    return {
        "status": "configured" if bool(settings.GEMINI_API_KEY) else "missing_key",
        "provider": "Google Gemini",
        "primary_model": settings.PRIMARY_GEMINI_MODEL,
        "fallback_models": settings.candidate_gemini_models,
        "gemini_active": bool(settings.GEMINI_API_KEY),
    }
