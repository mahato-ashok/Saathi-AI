"""
routes/auth_routes.py — Authentication endpoints: Register, Login, Me
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import User, Case, UserRole
from auth import verify_password, get_password_hash, create_access_token
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut, UpdateProfileRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _make_avatar(full_name: str) -> str:
    parts = full_name.strip().split()
    return "".join(p[0].upper() for p in parts[:2]) if parts else "??"


def _make_case_ref() -> str:
    """Generate a unique case reference like ST-XXXX"""
    import random
    return f"ST-{random.randint(1000, 9999)}"


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == req.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )

    # Create user
    now = datetime.now()
    join_date = now.strftime("%b %Y")
    avatar = _make_avatar(req.full_name)

    user = User(
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role=UserRole(req.role),
        age=req.age,
        area=req.area or ("Community Support Program" if req.role == "beneficiary" else "Care Team"),
        avatar=avatar,
        streak=0,
        join_date=join_date,
        checkin_base_score=0,
    )
    db.add(user)
    await db.flush()  # get user.id before case creation

    # If beneficiary → auto-create a case record for counsellors to view
    if req.role == "beneficiary":
        # Ensure unique case_ref
        case_ref = _make_case_ref()
        while True:
            r2 = await db.execute(select(Case).where(Case.case_ref == case_ref))
            if not r2.scalar_one_or_none():
                break
            case_ref = _make_case_ref()

        case = Case(
            case_ref=case_ref,
            user_id=user.id,
            score=0.0,
            risk="Low",
            status="Monitoring",
            trend="stable",
            open_alerts=0,
            notes="",
            indicators={"mood": "N/A", "sleep": "N/A", "anxiety": "N/A", "support": "N/A"},
        )
        db.add(case)

    await db.commit()
    await db.refresh(user)

    # Issue JWT
    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Validate role matches
    if user.role.value != req.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered as '{user.role.value}', not '{req.role}'"
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.get("/me", response_model=UserOut)
async def get_me(
    token: str = Depends(__import__("auth", fromlist=["oauth2_scheme"]).oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Returns the current authenticated user's profile."""
    from auth import decode_token
    payload = decode_token(token)
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(user)


@router.patch("/me", response_model=UserOut)
async def update_profile(
    body: UpdateProfileRequest,
    token: str = Depends(__import__("auth", fromlist=["oauth2_scheme"]).oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    from auth import decode_token
    payload = decode_token(token)
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.full_name is not None:
        user.full_name = body.full_name
        user.avatar = _make_avatar(body.full_name)
    if body.age is not None:
        user.age = body.age
    if body.area is not None:
        user.area = body.area

    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)
