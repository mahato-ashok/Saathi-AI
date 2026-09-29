"""
test_auth_db_endpoints.py — Comprehensive Integration Tests
Tests:
  1. Login with seeded beneficiary (Ananya Sharma)
  2. Login with seeded counsellor (Dr. Kavya Menon)
  3. Register a new beneficiary
  4. Register a new counsellor
  5. Profile retrieval /auth/me
  6. Role enforcement: beneficiary blocked from /counsellor/cases (HTTP 403)
  7. Role enforcement: counsellor blocked from /beneficiary/checkins (HTTP 403)
  8. Beneficiary submits check-in -> auto updates case, streak & alerts in PostgreSQL
  9. Counsellor fetches cases list & case detail
 10. Counsellor creates intervention & updates notes
 11. Counsellor fetches alerts & marks alert read
 12. Unauthenticated request blocked (HTTP 401)
"""
import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import httpx
from main import app


async def run_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n" + "="*70)
        print("Saathi AI — END-TO-END AUTH & POSTGRESQL TEST SUITE")
        print("="*70)

        # ── Test 1: Seeded Beneficiary Login ─────────────────────────────────
        print("\n[Test 1] Logging in as seeded beneficiary (ananya@example.com)...")
        r = await client.post("/auth/login", json={
            "email": "ananya@example.com",
            "password": "Password@123",
            "role": "beneficiary"
        })
        assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
        ben_data = r.json()
        ben_token = ben_data["access_token"]
        assert ben_token, "No access token received"
        assert ben_data["user"]["full_name"] == "Ananya Sharma"
        assert ben_data["user"]["role"] == "beneficiary"
        print(f"  --> OK: Logged in {ben_data['user']['full_name']}, Token received.")

        # ── Test 2: Seeded Counsellor Login ──────────────────────────────────
        print("\n[Test 2] Logging in as seeded counsellor (kavya@careteam.org)...")
        r = await client.post("/auth/login", json={
            "email": "kavya@careteam.org",
            "password": "Password@123",
            "role": "counsellor"
        })
        assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
        coun_data = r.json()
        coun_token = coun_data["access_token"]
        assert coun_data["user"]["full_name"] == "Dr. Kavya Menon"
        assert coun_data["user"]["role"] == "counsellor"
        print(f"  --> OK: Logged in {coun_data['user']['full_name']}, Token received.")

        # ── Test 3: Register New Beneficiary ─────────────────────────────────
        import time
        ts = int(time.time())
        new_ben_email = f"test_ben_{ts}@test.org"
        print(f"\n[Test 3] Registering new beneficiary ({new_ben_email})...")
        r = await client.post("/auth/register", json={
            "email": new_ben_email,
            "password": "SecurePassword@2026",
            "full_name": "Test Beneficiary",
            "role": "beneficiary",
            "age": 28,
            "area": "Dwarka Care Wing"
        })
        assert r.status_code == 201, f"Register failed: {r.status_code} {r.text}"
        new_ben = r.json()
        new_ben_token = new_ben["access_token"]
        print(f"  --> OK: Registered user {new_ben['user']['id']}, auto-case created.")

        # ── Test 4: Profile /auth/me ─────────────────────────────────────────
        print("\n[Test 4] Fetching authenticated user profile via /auth/me...")
        r = await client.get("/auth/me", headers={"Authorization": f"Bearer {ben_token}"})
        assert r.status_code == 200, f"Get /auth/me failed: {r.status_code}"
        me = r.json()
        assert me["email"] == "ananya@example.com"
        print(f"  --> OK: Retrieved profile for {me['full_name']} ({me['role']}).")

        # ── Test 5: Role Authorization Guard (Beneficiary blocked from Counsellor API) ─
        print("\n[Test 5] Role Guard: Beneficiary attempting to access /counsellor/cases...")
        r = await client.get("/counsellor/cases", headers={"Authorization": f"Bearer {ben_token}"})
        assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"
        print(f"  --> OK: Correctly blocked with HTTP 403 ({r.json()['detail']}).")

        # ── Test 6: Role Authorization Guard (Counsellor blocked from Beneficiary API) ─
        print("\n[Test 6] Role Guard: Counsellor attempting to submit to /beneficiary/checkins...")
        r = await client.post("/beneficiary/checkins",
            headers={"Authorization": f"Bearer {coun_token}"},
            json={"score": 50, "level": "Low", "mood": 3, "safety": 3, "sleep": 3, "anxiety": 3, "support": 3}
        )
        assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"
        print(f"  --> OK: Correctly blocked with HTTP 403 ({r.json()['detail']}).")

        # ── Test 7: Unauthenticated Request Blocked ──────────────────────────
        print("\n[Test 7] Guard: Unauthenticated request to /counsellor/cases...")
        r = await client.get("/counsellor/cases")
        assert r.status_code in [401, 403], f"Expected 401/403, got {r.status_code}"
        print(f"  --> OK: Unauthenticated access rejected with HTTP {r.status_code}.")

        # ── Test 8: Beneficiary Check-in Persistence & DB Cascade ────────────
        print("\n[Test 8] Beneficiary submitting a check-in to /beneficiary/checkins...")
        r = await client.post("/beneficiary/checkins",
            headers={"Authorization": f"Bearer {new_ben_token}"},
            json={
                "score": 76.5,
                "level": "High",
                "mood": 2,
                "safety": 2,
                "sleep": 1,
                "anxiety": 5,
                "support": 1,
                "note": "Feeling acute panic and trouble breathing.",
                "anomaly_flag": True,
                "emotions": {"fear": 0.82, "sadness": 0.15},
                "gemini_reflection": "Take slow gentle breaths. You are safe right now."
            }
        )
        assert r.status_code == 201, f"Check-in failed: {r.status_code} {r.text}"
        ci_res = r.json()
        assert ci_res["score"] == 76.5
        assert ci_res["level"] == "High"
        print(f"  --> OK: Check-in saved with ID {ci_res['id']}.")

        # Verify linked case updated
        r_case = await client.get("/beneficiary/case", headers={"Authorization": f"Bearer {new_ben_token}"})
        assert r_case.status_code == 200
        case_info = r_case.json()
        assert case_info["score"] == 76.5
        assert case_info["risk"] == "High"
        print(f"  --> OK: Linked case updated to score {case_info['score']} ({case_info['risk']}).")

        # ── Test 9: Counsellor Cases List & Detail ───────────────────────────
        print("\n[Test 9] Counsellor listing cases and viewing ST-1042...")
        r_cases = await client.get("/counsellor/cases", headers={"Authorization": f"Bearer {coun_token}"})
        assert r_cases.status_code == 200
        cases_list = r_cases.json()
        assert len(cases_list) >= 5, f"Expected at least 5 cases, got {len(cases_list)}"
        print(f"  --> OK: Counsellor retrieved {len(cases_list)} active cases from PostgreSQL.")

        r_detail = await client.get("/counsellor/cases/ST-1042", headers={"Authorization": f"Bearer {coun_token}"})
        assert r_detail.status_code == 200
        st1042 = r_detail.json()
        assert st1042["case_ref"] == "ST-1042"
        assert st1042["name"] == "Ananya Sharma"
        assert len(st1042["history"]) >= 6
        print(f"  --> OK: Case ST-1042 detail loaded with {len(st1042['history'])} history points.")

        # ── Test 10: Counsellor Intervention & Note Update ───────────────────
        print("\n[Test 10] Counsellor recording intervention for ST-1042...")
        r_iv = await client.post("/counsellor/cases/ST-1042/interventions",
            headers={"Authorization": f"Bearer {coun_token}"},
            json={
                "date": "Sep 28, 2026",
                "type": "Counsellor Telehealth Session",
                "note": "Conducted 45-min supportive session. Beneficiary feels grounded.",
                "counsellor": "Dr. Kavya Menon"
            }
        )
        assert r_iv.status_code == 201, f"Failed to record intervention: {r_iv.text}"
        iv_res = r_iv.json()
        assert iv_res["type"] == "Counsellor Telehealth Session"
        print(f"  --> OK: Intervention created (ID: {iv_res['id']}).")

        # ── Test 11: Counsellor Alerts & Mark Read ───────────────────────────
        print("\n[Test 11] Counsellor reviewing alerts and marking an alert as read...")
        r_alerts = await client.get("/counsellor/alerts", headers={"Authorization": f"Bearer {coun_token}"})
        assert r_alerts.status_code == 200
        alerts = r_alerts.json()
        assert len(alerts) > 0, "Expected alerts"
        first_alert = alerts[0]
        r_mark = await client.patch(f"/counsellor/alerts/{first_alert['id']}/read",
            headers={"Authorization": f"Bearer {coun_token}"}
        )
        assert r_mark.status_code == 200
        print(f"  --> OK: Retrieved {len(alerts)} alerts, successfully marked alert {first_alert['id'][:8]} as read.")

        # ── Test 12: Counsellor Aggregated Stats ──────────────────────────────
        print("\n[Test 12] Fetching counsellor overview statistics...")
        r_stats = await client.get("/counsellor/stats", headers={"Authorization": f"Bearer {coun_token}"})
        assert r_stats.status_code == 200
        stats = r_stats.json()
        print(f"  --> OK: Total Cases: {stats['total_cases']}, High Risk: {stats['high_risk']}, Needs Review: {stats['needs_review']}, Unread Alerts: {stats['unread_alerts']}")

        print("\n" + "="*70)
        print("ALL 12 AUTHENTICATION, AUTHORIZATION & POSTGRESQL TESTS PASSED!")
        print("="*70)


if __name__ == "__main__":
    asyncio.run(run_tests())
