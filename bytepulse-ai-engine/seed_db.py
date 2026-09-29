"""
seed_db.py — Database seeder for Saathi prototype
Populates users, cases, checkins, alerts, and interventions into PostgreSQL.
"""
import sys
import asyncio
from pathlib import Path

# Add current dir to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from database import engine, AsyncSessionLocal, init_db
from models import User, Case, CaseHistory, CheckIn, Alert, Intervention, UserRole
from auth import get_password_hash
from sqlalchemy import select


DEFAULT_PASSWORD = "Password@123"


async def seed():
    print("[*] Ensuring database tables exist...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if users already seeded
        res = await session.execute(select(User).where(User.email == "ananya@example.com"))
        if res.scalar_one_or_none():
            print("[INFO] Database already seeded. Skipping.")
            return

        print("[*] Seeding users and clinical case data...")

        hashed_pwd = get_password_hash(DEFAULT_PASSWORD)

        # ── 1. Counsellor ─────────────────────────────────────────────────────
        counsellor = User(
            email="kavya@careteam.org",
            hashed_password=hashed_pwd,
            full_name="Dr. Kavya Menon",
            role=UserRole.counsellor,
            age=38,
            area="Senior Clinical Supervisor • AI Triage Unit",
            avatar="KM",
            streak=0,
            join_date="Jun 2025",
            is_active=True,
        )
        session.add(counsellor)

        # ── 2. Beneficiaries & Cases ──────────────────────────────────────────
        beneficiaries_data = [
            {
                "email": "ananya@example.com",
                "name": "Ananya Sharma",
                "age": 29,
                "area": "Community Support Program",
                "avatar": "AS",
                "streak": 5,
                "join_date": "Aug 2026",
                "case_ref": "ST-1042",
                "score": 68.0,
                "risk": "Moderate",
                "status": "Needs review",
                "trend": "rising",
                "open_alerts": 2,
                "notes": "Feeling overwhelmed about the week ahead. Sleep has been poor.",
                "indicators": {"mood": "Low", "sleep": "Poor", "anxiety": "Elevated", "support": "Limited"},
                "history": [
                    45.0, 38.0, 47.0, 41.0, 54.0, 68.0
                ],
                "checkins": [
                    {"score": 68.0, "level": "Moderate", "mood": 2, "safety": 2, "sleep": 2, "anxiety": 4, "support": 2, "note": "Feeling overwhelmed about the week ahead. Sleep has been poor."},
                    {"score": 54.0, "level": "Moderate", "mood": 3, "safety": 3, "sleep": 2, "anxiety": 3, "support": 2, "note": ""},
                    {"score": 41.0, "level": "Low", "mood": 4, "safety": 4, "sleep": 3, "anxiety": 2, "support": 3, "note": "Better week overall."},
                ],
                "alerts": [
                    {"type": "Score increase", "severity": "warning", "message": "Distress score increased from 54 to 68 in latest check-in."},
                    {"type": "Sleep disruption", "severity": "warning", "message": "Poor sleep reported consecutively for 3 check-ins."},
                ],
                "interventions": [],
            },
            {
                "email": "rohan@example.com",
                "name": "Rohan Das",
                "age": 34,
                "area": "District Outreach Program",
                "avatar": "RD",
                "streak": 3,
                "join_date": "Jul 2026",
                "case_ref": "ST-1038",
                "score": 61.0,
                "risk": "Moderate",
                "status": "In follow-up",
                "trend": "stable",
                "open_alerts": 1,
                "notes": "Sleep has been inconsistent. Mentioned stress from work.",
                "indicators": {"mood": "Moderate", "sleep": "Irregular", "anxiety": "Mild", "support": "Partial"},
                "history": [55.0, 58.0, 60.0, 62.0, 61.0],
                "checkins": [
                    {"score": 61.0, "level": "Moderate", "mood": 3, "safety": 4, "sleep": 2, "anxiety": 3, "support": 3, "note": "Work stress is lingering."},
                ],
                "alerts": [
                    {"type": "Missed check-in", "severity": "info", "message": "Beneficiary missed scheduled check-in on Sep 12."},
                ],
                "interventions": [
                    {"date": "Sep 14, 2026", "type": "Check-in call", "note": "Scheduled for tomorrow morning. Beneficiary agreed.", "counsellor": "Dr. Kavya Menon"},
                ],
            },
            {
                "email": "meera@example.com",
                "name": "Meera Kumari",
                "age": 24,
                "area": "Community Safe Haven",
                "avatar": "MK",
                "streak": 8,
                "join_date": "May 2026",
                "case_ref": "ST-1029",
                "score": 82.0,
                "risk": "High",
                "status": "Escalated",
                "trend": "rising",
                "open_alerts": 4,
                "notes": "Reported persistent distress. Safety concern flagged. Support network limited.",
                "indicators": {"mood": "Very Low", "sleep": "Very Poor", "anxiety": "High", "support": "Absent"},
                "history": [50.0, 58.0, 67.0, 72.0, 78.0, 82.0],
                "checkins": [
                    {"score": 82.0, "level": "High", "mood": 1, "safety": 1, "sleep": 1, "anxiety": 5, "support": 1, "note": "I feel very overwhelmed and scared today.", "anomaly_flag": True},
                ],
                "alerts": [
                    {"type": "High distress", "severity": "critical", "message": "Distress score reached 82 — High risk threshold crossed. Immediate review recommended."},
                    {"type": "Safety alert", "severity": "critical", "message": "Low physical/emotional safety score submitted."},
                    {"type": "Anomaly detected", "severity": "critical", "message": "Isolation Forest detected acute behavioural disruption."},
                ],
                "interventions": [
                    {"date": "Sep 14, 2026", "type": "Emergency outreach call", "note": "Safety plan reviewed and emergency shelter contact provided.", "counsellor": "Dr. Kavya Menon"},
                    {"date": "Sep 13, 2026", "type": "Safety plan review", "note": "Updated safety plan shared with beneficiary.", "counsellor": "Dr. Kavya Menon"},
                ],
            },
            {
                "email": "priya@example.com",
                "name": "Priya Patel",
                "age": 31,
                "area": "Family Wellness Support",
                "avatar": "PP",
                "streak": 12,
                "join_date": "Apr 2026",
                "case_ref": "ST-1015",
                "score": 34.0,
                "risk": "Low",
                "status": "Monitoring",
                "trend": "falling",
                "open_alerts": 0,
                "notes": "Showing consistent positive progress. Good family support engagement.",
                "indicators": {"mood": "Good", "sleep": "Good", "anxiety": "Low", "support": "Strong"},
                "history": [65.0, 58.0, 50.0, 42.0, 37.0, 34.0],
                "checkins": [
                    {"score": 34.0, "level": "Low", "mood": 4, "safety": 5, "sleep": 4, "anxiety": 1, "support": 5, "note": "Feeling much better this week."},
                ],
                "alerts": [],
                "interventions": [],
            },
            {
                "email": "sunita@example.com",
                "name": "Sunita Devi",
                "age": 42,
                "area": "Crisis Response Network",
                "avatar": "SD",
                "streak": 4,
                "join_date": "Jun 2026",
                "case_ref": "ST-1008",
                "score": 74.0,
                "risk": "High",
                "status": "Needs review",
                "trend": "rising",
                "open_alerts": 3,
                "notes": "Late-night activity spike detected. Anxiety elevated.",
                "indicators": {"mood": "Low", "sleep": "Disrupted", "anxiety": "High", "support": "Low"},
                "history": [48.0, 52.0, 60.0, 68.0, 74.0],
                "checkins": [
                    {"score": 74.0, "level": "High", "mood": 2, "safety": 2, "sleep": 2, "anxiety": 4, "support": 2, "note": "Can't sleep at all lately."},
                ],
                "alerts": [
                    {"type": "High distress", "severity": "critical", "message": "Score jumped to 74 — High risk threshold crossed."},
                    {"type": "Late night activity", "severity": "warning", "message": "Anomalous late night activity pattern observed."},
                ],
                "interventions": [
                    {"date": "Sep 12, 2026", "type": "Check-in call", "note": "Discussed sleep hygiene and calming techniques.", "counsellor": "Dr. Kavya Menon"},
                ],
            },
        ]

        for b in beneficiaries_data:
            user = User(
                email=b["email"],
                hashed_password=hashed_pwd,
                full_name=b["name"],
                role=UserRole.beneficiary,
                age=b["age"],
                area=b["area"],
                avatar=b["avatar"],
                streak=b["streak"],
                join_date=b["join_date"],
                checkin_base_score=int(b["score"]),
                is_active=True,
            )
            session.add(user)
            await session.flush()

            # Case
            case = Case(
                case_ref=b["case_ref"],
                user_id=user.id,
                score=b["score"],
                risk=b["risk"],
                status=b["status"],
                trend=b["trend"],
                open_alerts=b["open_alerts"],
                notes=b["notes"],
                indicators=b["indicators"],
            )
            session.add(case)
            await session.flush()

            # Case History
            for score_val in b["history"]:
                hist = CaseHistory(case_id=case.id, score=score_val)
                session.add(hist)

            # Checkins
            for ci in b["checkins"]:
                checkin = CheckIn(
                    user_id=user.id,
                    score=ci["score"],
                    level=ci["level"],
                    mood=ci["mood"],
                    safety=ci["safety"],
                    sleep=ci["sleep"],
                    anxiety=ci["anxiety"],
                    support=ci["support"],
                    note=ci.get("note", ""),
                    anomaly_flag=ci.get("anomaly_flag", False),
                )
                session.add(checkin)

            # Alerts
            for al in b["alerts"]:
                alert = Alert(
                    case_id=case.id,
                    user_id=user.id,
                    type=al["type"],
                    severity=al["severity"],
                    message=al["message"],
                    read=False,
                )
                session.add(alert)

            # Interventions
            for iv in b["interventions"]:
                intervention = Intervention(
                    case_id=case.id,
                    date=iv["date"],
                    type=iv["type"],
                    note=iv["note"],
                    counsellor=iv["counsellor"],
                )
                session.add(intervention)

        await session.commit()
        print("[SUCCESS] Seeded PostgreSQL database with 1 Counsellor and 5 Beneficiaries + Cases + History + Alerts + Interventions!")


if __name__ == "__main__":
    asyncio.run(seed())
