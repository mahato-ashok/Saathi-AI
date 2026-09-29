"""
core/config.py — Centralized Application Settings & Environment Config
"""
import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Root path for backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file from bytepulse-ai-engine/.env or root
_env_path = BASE_DIR / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()


class Settings:
    PROJECT_NAME: str = "BytePulse Multimodal Distress Monitoring Engine"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://saathi_user:saathi%402026@localhost:5433/saathi_db"
    )

    # JWT Authentication
    SECRET_KEY: str = (
        os.getenv("JWT_SECRET_KEY")
        or os.getenv("JWT_SECRET")
        or "saathi-super-secret-jwt-key-2026-change-in-production"
    )
    ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

    # Gemini AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    PRIMARY_GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # Ordered candidate fallback models
    @property
    def candidate_gemini_models(self) -> List[str]:
        raw_candidates = [self.PRIMARY_GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.5-pro", "gemini-flash-latest"]
        seen = set()
        return [m for m in raw_candidates if not (m in seen or seen.add(m))]

    # ML & NLP Models
    BEHAVIORAL_MODEL_PATH: Path = BASE_DIR / "models" / "behavioral_anomaly_model.pkl"
    NLP_MODEL_NAME: str = "j-hartmann/emotion-english-distilroberta-base"

    # CORS
    CORS_ORIGINS: List[str] = ["*"]


settings = Settings()
