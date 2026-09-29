"""
schemas.py — Pydantic Request/Response schemas for Auth & Data APIs
"""
import uuid
from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, EmailStr, field_validator


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str          # "beneficiary" or "counsellor"
    age: Optional[int] = None
    area: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v not in ("beneficiary", "counsellor"):
            raise ValueError("role must be 'beneficiary' or 'counsellor'")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    age: Optional[int]
    area: Optional[str]
    avatar: Optional[str]
    streak: int
    join_date: Optional[str]
    last_checkin_date: Optional[str]
    checkin_base_score: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    area: Optional[str] = None


# ── Check-in Schemas ──────────────────────────────────────────────────────────

class CheckInCreate(BaseModel):
    score: float
    level: str
    mood: int
    safety: int
    sleep: int
    anxiety: int
    support: int
    note: Optional[str] = ""
    anomaly_flag: bool = False
    emotions: Optional[Dict[str, float]] = None
    gemini_reflection: Optional[str] = None


class CheckInOut(BaseModel):
    id: uuid.UUID
    score: float
    level: str
    mood: int
    safety: int
    sleep: int
    anxiety: int
    support: int
    note: Optional[str]
    anomaly_flag: bool
    emotions: Optional[Dict[str, float]]
    gemini_reflection: Optional[str]
    submitted_at: datetime

    model_config = {"from_attributes": True}


# ── Case History & Intervention ───────────────────────────────────────────────

class CaseHistoryOut(BaseModel):
    score: float
    recorded_at: datetime
    d: Optional[str] = None

    model_config = {"from_attributes": True}


class InterventionCreate(BaseModel):
    type: str
    note: str
    counsellor: Optional[str] = None


class InterventionOut(BaseModel):
    id: uuid.UUID
    date: str
    type: str
    note: str
    counsellor: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Case Schemas ──────────────────────────────────────────────────────────────

class CaseOut(BaseModel):
    id: uuid.UUID
    case_ref: str
    score: float
    risk: str
    status: str
    trend: str
    open_alerts: int
    notes: Optional[str] = None
    indicators: Optional[Dict[str, str]] = None
    updated_at: datetime
    name: Optional[str] = None
    age: Optional[int] = None
    area: Optional[str] = None
    avatar: Optional[str] = None
    history: List[CaseHistoryOut] = []
    interventions: List[InterventionOut] = []

    model_config = {"from_attributes": True}


# ── Alert Schemas ──────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: uuid.UUID
    type: str
    severity: str
    message: str
    read: bool
    created_at: datetime
    case_ref: Optional[str] = None
    beneficiary_name: Optional[str] = None

    model_config = {"from_attributes": True}


class AlertMarkRead(BaseModel):
    alert_ids: List[uuid.UUID]


# ── Chat Schemas ───────────────────────────────────────────────────────────────

class ChatMessageOut(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    emotions: Optional[Dict[str, float]]
    distress_signal: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Counsellor List Schema ─────────────────────────────────────────────────────

class CounsellorCaseListItem(BaseModel):
    case_ref: str
    user_id: str
    beneficiary_name: str
    age: Optional[int]
    area: Optional[str]
    score: float
    risk: str
    status: str
    trend: str
    open_alerts: int
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── AI & ML Inference Schemas ──────────────────────────────────────────────────

class VictimData(BaseModel):
    text_input: str
    screen_time_hours: float
    missed_checkins: int
    late_night_hours: float


class CheckinPayload(BaseModel):
    screen_time: float
    missed_checkins: int
    late_night_activity: float
    mood_score: Optional[float] = None
    safety_score: Optional[float] = None
    sleep_score: Optional[float] = None
    anxiety_score: Optional[float] = None
    support_score: Optional[float] = None
    text: Optional[str] = ""


class ChatPayload(BaseModel):
    screen_time: float = 8.0
    missed_checkins: int = 1
    late_night_activity: float = 0.3
    mood_score: Optional[float] = None
    safety_score: Optional[float] = None
    transcript: Optional[str] = ""
    note: Optional[str] = ""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_context: Optional[str] = ""
    user_id: Optional[str] = None   # optional: if provided, chat is persisted to DB


class CaseSummaryRequest(BaseModel):
    case_id: str
    name: str
    age: Optional[int] = 25
    score: float
    risk_level: str
    trend: Optional[str] = "stable"
    indicators: Optional[dict] = None
    notes: Optional[str] = ""
    history: Optional[List[dict]] = None
    alerts_count: Optional[int] = 0

