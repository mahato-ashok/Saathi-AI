"""
main.py — BytePulse Multimodal AI Engine (FastAPI Entrypoint)

Architecture:
  - core/      : Settings, Database async engine & session management, JWT & RBAC security
  - services/  : Multimodal ML Distress Service (Isolation Forest + DistilRoBERTa) & Google Gemini AI Service
  - routes/    : Auth, Beneficiary, Counsellor, AI Inference & Health APIRouters
  - models.py  : SQLAlchemy 2.0 ORM Relational Models
  - schemas.py : Pydantic V2 Request & Response Data Contracts
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import init_db
from routes import (
    health_router,
    auth_router,
    beneficiary_router,
    counsellor_router,
    ai_router,
)

# Services re-exports for backward-compatibility
from services.ml_service import run_analysis, extract_text_emotions, get_behavior_model, get_nlp_model
from services.gemini_service import (
    call_gemini_chat,
    call_gemini_generate,
    generate_checkin_reflection,
    generate_counsellor_summary,
    sanitize_gemini_history,
    SAATHI_SYSTEM_PROMPT,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application Lifespan: Initializes PostgreSQL database tables upon startup."""
    await init_db()
    yield


# ── FastAPI Application Instance ──────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multimodal AI distress monitoring and early-intervention engine with Google Gemini & PyTorch",
    lifespan=lifespan,
)

# ── CORS Middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Modular Routers ──────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(beneficiary_router)
app.include_router(counsellor_router)
app.include_router(ai_router)


# ── Backward-Compatibility Helpers ────────────────────────────────────────────
_run_analysis = run_analysis

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
