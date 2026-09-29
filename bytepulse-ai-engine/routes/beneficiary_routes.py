"""
routes/beneficiary_routes.py — Beneficiary-only data endpoints
Endpoints: check-ins, chat history, personal profile, dashboard data
All require JWT with role=beneficiary
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from database import get_db
from models import User, CheckIn, Case, CaseHistory, ChatMessage, Alert, Intervention
from auth import oauth2_scheme, decode_token
from schemas import (
    CheckInCreate, CheckInOut, CaseOut, ChatMessageOut, UserOut, AlertOut
)

router = APIRouter(prefix="/beneficiary", tags=["Beneficiary"])


async def _get_beneficiary(token: str, db: AsyncSession) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.role.value != "beneficiary":
        raise HTTPException(status_code=403, detail="Beneficiary access required")
    return user


# ── Check-ins ─────────────────────────────────────────────────────────────────

@router.post("/checkins", response_model=CheckInOut, status_code=201)
async def create_checkin(
    body: CheckInCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await _get_beneficiary(token, db)

    checkin = CheckIn(
        user_id=user.id,
        score=body.score,
        level=body.level,
        mood=body.mood,
        safety=body.safety,
        sleep=body.sleep,
        anxiety=body.anxiety,
        support=body.support,
        note=body.note or "",
        anomaly_flag=body.anomaly_flag,
        emotions=body.emotions,
        gemini_reflection=body.gemini_reflection,
    )
    db.add(checkin)
    await db.flush()

    # Update user streak and last check-in date
    from datetime import timedelta
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday_str = (datetime.now(timezone.utc).date() - timedelta(days=1)).strftime("%Y-%m-%d")
    prev_date = user.last_checkin_date

    if prev_date == yesterday_str:
        user.streak = (user.streak or 0) + 1
    elif prev_date != today_str:
        user.streak = 1

    user.last_checkin_date = today_str
    user.checkin_base_score = int(body.score)

    # Update linked case
    case_result = await db.execute(select(Case).where(Case.user_id == user.id))
    case = case_result.scalar_one_or_none()
    if case:
        # Update trend
        old_score = case.score
        trend = "stable"
        if body.score > old_score + 5:
            trend = "rising"
        elif body.score < old_score - 5:
            trend = "falling"

        case.score = body.score
        case.risk = body.level
        case.trend = trend
        case.notes = body.note or case.notes
        case.indicators = {
            "mood": _score_label(body.mood, "mood"),
            "sleep": _score_label(body.sleep, "sleep"),
            "anxiety": _score_label(body.anxiety, "anxiety"),
            "support": _score_label(body.support, "support"),
        }

        if body.score >= 60:
            case.status = "Needs review"
            # Create an alert for counsellors
            severity = "critical" if body.score >= 75 else "warning"
            alert = Alert(
                case_id=case.id,
                user_id=user.id,
                type="High distress" if body.score >= 75 else "Score increase",
                severity=severity,
                message=f"{user.full_name}'s distress score is {body.score:.0f}/100 ({body.level}). Risk: {case.trend} trend.",
                read=False,
            )
            db.add(alert)
            case.open_alerts = case.open_alerts + 1

        # Add history point
        hist = CaseHistory(case_id=case.id, score=body.score)
        db.add(hist)

    await db.commit()
    await db.refresh(checkin)
    return CheckInOut.model_validate(checkin)


@router.get("/checkins", response_model=list[CheckInOut])
async def list_checkins(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    limit: int = 20
):
    user = await _get_beneficiary(token, db)
    result = await db.execute(
        select(CheckIn).where(CheckIn.user_id == user.id)
        .order_by(desc(CheckIn.submitted_at)).limit(limit)
    )
    checkins = result.scalars().all()
    return [CheckInOut.model_validate(c) for c in checkins]


# ── My Case (distress dashboard data) ────────────────────────────────────────

@router.get("/case", response_model=CaseOut)
@router.get("/my-case", response_model=CaseOut)
async def get_my_case(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await _get_beneficiary(token, db)
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.history), selectinload(Case.interventions), selectinload(Case.user))
        .where(Case.user_id == user.id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="No case found for this user")

    out = CaseOut.model_validate(case)
    if case.user:
        out.name = case.user.full_name
        out.age = case.user.age
        out.area = case.user.area
        out.avatar = case.user.avatar
    for h in out.history:
        h.d = f"{h.recorded_at.day} {h.recorded_at.strftime('%b')}"
    return out


# ── Chat Messages ─────────────────────────────────────────────────────────────

@router.get("/chat-history", response_model=list[ChatMessageOut])
async def get_chat_history(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    limit: int = 50
):
    user = await _get_beneficiary(token, db)
    result = await db.execute(
        select(ChatMessage).where(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at).limit(limit)
    )
    messages = result.scalars().all()
    return [ChatMessageOut.model_validate(m) for m in messages]


@router.post("/chat-history", status_code=201)
async def save_chat_message(
    body: dict,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await _get_beneficiary(token, db)
    msg = ChatMessage(
        user_id=user.id,
        role=body.get("role", "user"),
        content=body.get("content", ""),
        emotions=body.get("emotions"),
        distress_signal=body.get("distress_signal"),
    )
    db.add(msg)
    await db.commit()
    return {"ok": True}


# ── Alerts ────────────────────────────────────────────────────────────────────

@router.get("/alerts", response_model=list[AlertOut])
async def my_alerts(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user = await _get_beneficiary(token, db)
    result = await db.execute(
        select(Alert).where(Alert.user_id == user.id)
        .order_by(desc(Alert.created_at)).limit(10)
    )
    return [AlertOut.model_validate(a) for a in result.scalars().all()]


# ── Helper ────────────────────────────────────────────────────────────────────

def _score_label(score: int, field: str) -> str:
    labels = {
        "mood":    {1: "Very Low", 2: "Low", 3: "Fair", 4: "Good", 5: "Very Good"},
        "sleep":   {1: "Very Poor", 2: "Poor", 3: "Variable", 4: "Good", 5: "Very Good"},
        "anxiety": {1: "None", 2: "Mild", 3: "Moderate", 4: "Elevated", 5: "High"},
        "support": {1: "Absent", 2: "Limited", 3: "Partial", 4: "Good", 5: "Strong"},
    }
    return labels.get(field, {}).get(score, "N/A")
