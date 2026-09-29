"""
routes/counsellor_routes.py — Counsellor-only data endpoints
Endpoints: all cases, case detail, interventions, alerts, stats
All require JWT with role=counsellor
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload

from database import get_db
from models import User, Case, CaseHistory, Alert, Intervention
from auth import oauth2_scheme, decode_token
from schemas import (
    CaseOut, AlertOut, AlertMarkRead, InterventionCreate, InterventionOut,
    CounsellorCaseListItem
)

router = APIRouter(prefix="/counsellor", tags=["Counsellor"])


async def _get_counsellor(token: str, db: AsyncSession) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.role.value != "counsellor":
        raise HTTPException(status_code=403, detail="Counsellor access required")
    return user


# ── Cases List ────────────────────────────────────────────────────────────────

@router.get("/cases", response_model=list[CounsellorCaseListItem])
async def list_cases(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    risk: str = None,       # optional filter: Low/Moderate/High
    limit: int = 50,
    offset: int = 0
):
    await _get_counsellor(token, db)

    query = (
        select(Case, User)
        .join(User, Case.user_id == User.id)
        .order_by(desc(Case.score))
        .limit(limit).offset(offset)
    )
    if risk:
        query = query.where(Case.risk == risk)

    result = await db.execute(query)
    rows = result.all()

    items = []
    for case, user in rows:
        items.append(CounsellorCaseListItem(
            case_ref=case.case_ref,
            user_id=str(user.id),
            beneficiary_name=user.full_name,
            age=user.age,
            area=user.area,
            score=case.score,
            risk=case.risk,
            status=case.status,
            trend=case.trend,
            open_alerts=case.open_alerts,
            updated_at=case.updated_at,
        ))
    return items


# ── Case Detail ───────────────────────────────────────────────────────────────

@router.get("/cases/{case_ref}", response_model=CaseOut)
async def get_case(
    case_ref: str,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    await _get_counsellor(token, db)

    result = await db.execute(
        select(Case)
        .options(selectinload(Case.history), selectinload(Case.interventions), selectinload(Case.user))
        .where(Case.case_ref == case_ref)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_ref} not found")

    out = CaseOut.model_validate(case)
    if case.user:
        out.name = case.user.full_name
        out.age = case.user.age
        out.area = case.user.area
        out.avatar = case.user.avatar
    for h in out.history:
        h.d = f"{h.recorded_at.day} {h.recorded_at.strftime('%b')}"
    return out


# ── Interventions ─────────────────────────────────────────────────────────────

@router.post("/cases/{case_ref}/interventions", response_model=InterventionOut, status_code=201)
async def add_intervention(
    case_ref: str,
    body: InterventionCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    counsellor = await _get_counsellor(token, db)

    result = await db.execute(select(Case).where(Case.case_ref == case_ref))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_ref} not found")

    now_utc = datetime.now(timezone.utc)
    today = f"{now_utc.day} {now_utc.strftime('%b')}"

    iv = Intervention(
        case_id=case.id,
        date=today,
        type=body.type,
        note=body.note,
        counsellor=body.counsellor or counsellor.full_name,
    )
    db.add(iv)

    # Update case status
    case.status = "In follow-up"
    await db.commit()
    await db.refresh(iv)
    return InterventionOut.model_validate(iv)


# ── Alerts ────────────────────────────────────────────────────────────────────

@router.get("/alerts", response_model=list[AlertOut])
async def list_alerts(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    unread_only: bool = False,
    limit: int = 50
):
    await _get_counsellor(token, db)

    query = select(Alert, Case, User).join(Case, Alert.case_id == Case.id, isouter=True).join(User, Alert.user_id == User.id)
    if unread_only:
        query = query.where(Alert.read == False)
    query = query.order_by(desc(Alert.created_at)).limit(limit)

    result = await db.execute(query)
    rows = result.all()

    items = []
    for alert, case, user in rows:
        items.append(AlertOut(
            id=alert.id,
            type=alert.type,
            severity=alert.severity,
            message=alert.message,
            read=alert.read,
            created_at=alert.created_at,
            case_ref=case.case_ref if case else None,
            beneficiary_name=user.full_name if user else None,
        ))
    return items


@router.patch("/alerts/mark-read")
async def mark_alerts_read(
    body: AlertMarkRead,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    await _get_counsellor(token, db)

    result = await db.execute(
        select(Alert).where(Alert.id.in_(body.alert_ids))
    )
    alerts = result.scalars().all()
    for alert in alerts:
        alert.read = True
    await db.commit()
    return {"marked": len(alerts)}


@router.patch("/alerts/{alert_id}/read")
async def mark_single_alert_read(
    alert_id: str,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    await _get_counsellor(token, db)
    import uuid
    try:
        aid = uuid.UUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert UUID")

    result = await db.execute(select(Alert).where(Alert.id == aid))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.read = True
    await db.commit()
    return {"status": "ok", "alert_id": alert_id, "read": True}


# ── Dashboard Stats ────────────────────────────────────────────────────────────

@router.get("/stats")
async def dashboard_stats(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    await _get_counsellor(token, db)

    # Count cases by risk
    total = await db.execute(select(func.count()).select_from(Case))
    total_cases = total.scalar()

    high = await db.execute(select(func.count()).select_from(Case).where(Case.risk == "High"))
    moderate = await db.execute(select(func.count()).select_from(Case).where(Case.risk == "Moderate"))
    low = await db.execute(select(func.count()).select_from(Case).where(Case.risk == "Low"))
    needs_review = await db.execute(select(func.count()).select_from(Case).where(Case.status == "Needs review"))
    unread_alerts = await db.execute(select(func.count()).select_from(Alert).where(Alert.read == False))

    return {
        "total_cases": total_cases,
        "high_risk": high.scalar(),
        "moderate_risk": moderate.scalar(),
        "low_risk": low.scalar(),
        "needs_review": needs_review.scalar(),
        "unread_alerts": unread_alerts.scalar(),
    }
