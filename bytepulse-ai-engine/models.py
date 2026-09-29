"""
models.py — SQLAlchemy ORM Models for Saathi
Tables: users, checkins, cases, case_history, alerts, interventions, chat_messages
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Integer, Float, Boolean, Text, DateTime, ForeignKey,
    Enum as SAEnum, func, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

import enum


class UserRole(str, enum.Enum):
    beneficiary = "beneficiary"
    counsellor = "counsellor"


class RiskLevel(str, enum.Enum):
    Low = "Low"
    Moderate = "Moderate"
    High = "High"


class AlertSeverity(str, enum.Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


# ── Users ─────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    area: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # initials
    streak: Mapped[int] = mapped_column(Integer, default=0)
    join_date: Mapped[str] = mapped_column(String(50), nullable=True)
    last_checkin_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    checkin_base_score: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    checkins: Mapped[list["CheckIn"]] = relationship("CheckIn", back_populates="user", cascade="all, delete-orphan")
    case: Mapped[Optional["Case"]] = relationship("Case", back_populates="user", uselist=False, cascade="all, delete-orphan")
    chat_messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="user", cascade="all, delete-orphan")


# ── Check-ins ─────────────────────────────────────────────────────────────────
class CheckIn(Base):
    __tablename__ = "checkins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    level: Mapped[str] = mapped_column(String(20), nullable=False)  # Low/Moderate/High
    mood: Mapped[int] = mapped_column(Integer, default=3)
    safety: Mapped[int] = mapped_column(Integer, default=3)
    sleep: Mapped[int] = mapped_column(Integer, default=3)
    anxiety: Mapped[int] = mapped_column(Integer, default=3)
    support: Mapped[int] = mapped_column(Integer, default=3)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    anomaly_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    emotions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    gemini_reflection: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="checkins")


# ── Cases (one per beneficiary user) ─────────────────────────────────────────
class Case(Base):
    __tablename__ = "cases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_ref: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # e.g. ST-1042
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    risk: Mapped[str] = mapped_column(String(20), default="Low")
    status: Mapped[str] = mapped_column(String(50), default="Monitoring")
    trend: Mapped[str] = mapped_column(String(20), default="stable")
    open_alerts: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    indicators: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="case")
    history: Mapped[list["CaseHistory"]] = relationship("CaseHistory", back_populates="case", cascade="all, delete-orphan", order_by="CaseHistory.recorded_at")
    interventions: Mapped[list["Intervention"]] = relationship("Intervention", back_populates="case", cascade="all, delete-orphan", order_by="Intervention.created_at.desc()")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="case", cascade="all, delete-orphan")


# ── Case History ──────────────────────────────────────────────────────────────
class CaseHistory(Base):
    __tablename__ = "case_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="history")


# ── Alerts ────────────────────────────────────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="info")  # info/warning/critical
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    case: Mapped[Optional["Case"]] = relationship("Case", back_populates="alerts")
    user: Mapped["User"] = relationship("User", back_populates="alerts")


# ── Interventions ─────────────────────────────────────────────────────────────
class Intervention(Base):
    __tablename__ = "interventions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[str] = mapped_column(String(30), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    counsellor: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="interventions")


# ── Chat Messages ─────────────────────────────────────────────────────────────
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)   # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    emotions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    distress_signal: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="chat_messages")
