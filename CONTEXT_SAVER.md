# 🧠 Saathi AI Distress Monitoring Prototype — Master Context Saver & Agent Handover Guide

> **Target Audience:** Any AI agent or engineer taking over this repository.  
> **Repository Root:** `saathi-ai-distress-monitoring-prototype`  
> **Last Verified & Updated:** September 2026  
> **Status:** Operational & Fully Wired (PostgreSQL 18 + JWT Auth + RBAC + FastAPI + React 19 + DistilRoBERTa + Isolation Forest + Google Gemini 2.5 Flash Cascade)

---

## 1. Executive Summary & Project Purpose

**Saathi** (accompanied by the **BytePulse AI Engine**) is a dual-interface, AI-assisted mental health distress monitoring and early-intervention platform designed specifically for survivors of domestic violence and individuals under acute emotional strain (originally developed for SIH Problem Statement 26094).

### Key Value Propositions
1. **Secure Dual-Role Authentication & RBAC:** Complete registration and login system with bcrypt hashing, JWT bearer tokens, and strict role guards separating Beneficiary and Counsellor spaces.
2. **PostgreSQL 18 Relational Data Persistence:** Full SQLAlchemy 2.0 async engine and session management persisting users, cases, check-ins, case trajectory history, alerts, interventions, and companion chat messages.
3. **Multimodal Distress Detection:** Combines behavioural telemetry proxies (sleep disruption, screen time, social withdrawal, missed check-ins) with natural language text analysis.
4. **Empathetic AI Companion ("Saathi"):** A conversational wellness chatbot powered by **Google Gemini** (`gemini-2.5-flash` with multi-model fallback) with strict non-clinical safety boundaries, crisis hotline intervention triggers, and real-time sentiment scoring.
5. **Closed-Loop Care Delivery:** Beneficiary check-ins and chatbot interactions directly feed into dynamic risk scores ($0–100$), generating real-time escalation alerts on a Counsellor Dashboard for human review.
6. **AI Clinical Synthesis for Counsellors:** Dedicated Gemini-powered case brief generation that summarizes distress trajectory, flags acute concerns, and recommends prioritized counsellor interventions.

---

## 2. High-Level Architecture & Data Flow

```
                      +---------------------------------------+
                      |         BENEFICIARY / COUNSELLOR      |
                      |            Browser / Web UI           |
                      +-------------------+-------------------+
                                          |
                                          | HTTP (Port 5173)
                                          v
                      +---------------------------------------+
                      |       Vite Frontend Dev Server        |
                      |   Reverse Proxy: /api -> :8000/       |
                      +-------------------+-------------------+
                                          |
                                          | Reverse-proxied requests with JWT Bearer
                                          v
                      +---------------------------------------+
                      |      BytePulse AI Engine (FastAPI)    |
                      |              (Port 8000)              |
                      +---+-------------------------------+---+
                          |                               |
        +-----------------+---------------+               |
        |                                 |               |
        v                                 v               v
+-----------------------+     +-------------------+   +--------------------+
|  PostgreSQL 18 DB     |     |   DistilRoBERTa   |   | Google Gemini API  |
|  (asyncpg/SQLAlchemy) |     | Emotion Detection |   | (gemini-2.5-flash) |
|  7 Relational Tables  |     | (Hugging Face)    |   | Companion + Triage |
+-----------------------+     +-------------------+   +--------------------+
        |
        v
+-----------------------+
|  Isolation Forest     |
|  Behavioral Anomaly   |
|  (models/*.pkl)       |
+-----------------------+
```

### End-to-End Interaction Flow
1. **Authentication & Authorization:**
   - Beneficiaries and Counsellors sign in or register at `/login/beneficiary`, `/login/counsellor`, `/register/beneficiary`, `/register/counsellor`.
   - Passwords hashed with standard `bcrypt`.
   - JWT issued with `{ "sub": user_id, "role": role, "exp": ... }`.
   - Protected routes in React (`<ProtectedRoute role="...">`) prevent unauthorized role access.
   - FastAPI dependencies (`get_current_user` and `require_role`) enforce backend authorization (HTTP 401/403).

2. **Beneficiary Check-In Flow (PostgreSQL Synced):**
   - User navigates to `/beneficiary/checkin` and submits 5 Likert metrics (Mood, Safety, Sleep, Anxiety, Support) + freeform journal note.
   - Frontend calls `POST /api/predict` to get ML risk score ($0–100$), DistilRoBERTa emotions, anomaly flag, and Gemini personalized validation note.
   - Check-in is immediately persisted to PostgreSQL via `POST /api/beneficiary/checkins`.
   - Backend auto-updates beneficiary's linked Case score, trend (`rising`/`falling`/`stable`), clinical indicators, streaks, and triggers Counsellor alerts if high distress ($\ge 60$ or anomaly).

3. **Saathi Companion Chat Flow:**
   - Floating chat widget connects via `POST /api/chat`.
   - Backend calls **Google Gemini (`gemini-2.5-flash`)** using `SAATHI_SYSTEM_PROMPT` and sanitized conversation history.
   - DistilRoBERTa extracts emotion distress signals in real time.
   - Chatbot updates the user's live distress score via `nudgeDistressScore()`.

4. **Counsellor Triage & AI Clinical Synthesis Flow:**
   - Counsellor views case details at `/counsellor/cases/:ref`.
   - Clicks **"Generate Gemini Brief"** (`POST /api/counsellor/ai-summary`).
   - Gemini analyzes distress trajectory and provides clinical overview, key concerns, and recommended actions.
   - Counsellor documents human interventions via `POST /api/counsellor/cases/:ref/interventions` (persisted in PostgreSQL).

---

## 3. Database Schema (`saathi_db` on PostgreSQL 18)

Managed via SQLAlchemy 2.0 Async in `bytepulse-ai-engine/models.py`:

| Table | Primary Key | Key Columns / Foreign Keys | Description |
|---|---|---|---|
| `users` | `id` (UUID) | `email` (unique), `hashed_password`, `full_name`, `role` (`beneficiary`/`counsellor`), `age`, `area`, `avatar`, `streak`, `join_date` | Registered user profiles |
| `cases` | `id` (UUID) | `user_id` (FK `users.id`), `case_ref` (unique, e.g. `ST-1042`), `score`, `risk` (`Low`/`Moderate`/`High`), `status`, `trend`, `open_alerts`, `notes`, `indicators` (JSON) | Beneficiary care cases |
| `case_history` | `id` (UUID) | `case_id` (FK `cases.id`), `score`, `recorded_at` | Historical trajectory data points for charting |
| `checkins` | `id` (UUID) | `user_id` (FK `users.id`), `score`, `level`, `mood`, `safety`, `sleep`, `anxiety`, `support`, `note`, `anomaly_flag`, `emotions` (JSON), `gemini_reflection`, `submitted_at` | Daily wellbeing check-ins |
| `alerts` | `id` (UUID) | `case_id` (FK `cases.id`), `user_id` (FK `users.id`), `type`, `severity` (`info`/`warning`/`critical`), `message`, `read`, `created_at` | Real-time triage escalation alerts |
| `interventions` | `id` (UUID) | `case_id` (FK `cases.id`), `date`, `type`, `note`, `counsellor`, `created_at` | Documented clinical outreach actions |
| `chat_messages` | `id` (UUID) | `user_id` (FK `users.id`), `role` (`user`/`assistant`), `content`, `emotions` (JSON), `distress_signal`, `created_at` | Conversation log with Saathi companion |

---

## 4. Test Credentials & Database Seeder

The database is pre-seeded with test accounts via `bytepulse-ai-engine/seed_db.py`:

| Role | Email | Password | Name | Initial Case Data |
|---|---|---|---|---|
| **Counsellor** | `kavya@careteam.org` | `Password@123` | Dr. Kavya Menon | Senior Clinical Supervisor |
| **Beneficiary** | `ananya@example.com` | `Password@123` | Ananya Sharma | Case `ST-1042` (Score: 68, Moderate, rising trend, 2 alerts) |
| **Beneficiary** | `rohan@example.com` | `Password@123` | Rohan Das | Case `ST-1038` (Score: 61, Moderate, stable trend, 1 alert) |
| **Beneficiary** | `meera@example.com` | `Password@123` | Meera Kumari | Case `ST-1029` (Score: 82, High, rising trend, 4 alerts) |
| **Beneficiary** | `priya@example.com` | `Password@123` | Priya Patel | Case `ST-1015` (Score: 34, Low, falling trend, 0 alerts) |
| **Beneficiary** | `sunita@example.com` | `Password@123` | Sunita Devi | Case `ST-1008` (Score: 74, High, rising trend, 3 alerts) |

To re-seed or reset database:
```powershell
.\.venv\Scripts\python bytepulse-ai-engine/seed_db.py
```

---

## 5. Modular Code Architecture (`bytepulse-ai-engine`)

The backend follows Clean Modular Architecture with strict separation of concerns:
```
bytepulse-ai-engine/
├── core/
│   ├── config.py           # Centralized settings (DB, JWT, Gemini, CORS)
│   ├── database.py         # Async SQLAlchemy 2.0 engine, sessions & init_db
│   └── security.py         # Passlib/Bcrypt hashing, JWT encoder & RBAC guards
├── services/
│   ├── ml_service.py       # DistilRoBERTa + Isolation Forest distress scorer
│   └── gemini_service.py   # Gemini API client, multi-model fallback cascade & prompts
├── routes/
│   ├── auth_routes.py      # /auth/register, /auth/login, /auth/me
│   ├── beneficiary_routes.py # /beneficiary/checkins, /beneficiary/my-case
│   ├── counsellor_routes.py  # /counsellor/cases, /counsellor/alerts, /counsellor/stats
│   ├── ai_routes.py        # /predict, /chat, /counsellor/ai-summary, /chat-analyze
│   └── health_routes.py    # /, /health, /gemini-status
├── models.py               # SQLAlchemy 2.0 ORM database models
├── schemas.py              # Pydantic V2 Request & Response schemas
├── main.py                 # FastAPI application entrypoint & middleware assembly
├── seed_db.py              # Database seeding script
└── test_auth_db_endpoints.py # 12-step end-to-end integration test suite
```

## 6. API Reference

All endpoints run on `http://127.0.0.1:8000` (or `/api/*` via Vite dev proxy).

### Authentication (`/auth`)
- `POST /auth/register` — Register beneficiary or counsellor. Automatically creates a linked Case for beneficiaries.
- `POST /auth/login` — Sign in with email, password, and expected role. Returns JWT access token and user profile.
- `GET /auth/me` — Returns authenticated user's profile (`Bearer <token>` required).
- `PATCH /auth/me` — Update user profile details.

### Beneficiary Endpoints (`/beneficiary`) — Requires `role=beneficiary`
- `POST /beneficiary/checkins` — Submits check-in, recalculates streak, updates linked Case score/trend/indicators, and generates alerts if distress is elevated.
- `GET /beneficiary/checkins` — Lists previous check-in submissions.
- `GET /beneficiary/case` (or `/beneficiary/my-case`) — Returns the user's distress score, risk level, trajectory history, and alerts.
- `GET /beneficiary/alerts` — Lists alerts for the beneficiary.
- `GET /beneficiary/chat-history` — Fetches saved chat logs.

### Counsellor Endpoints (`/counsellor`) — Requires `role=counsellor`
- `GET /counsellor/cases` — Lists all active cases with optional `?risk=High|Moderate|Low` filtering.
- `GET /counsellor/cases/{case_ref}` — Retrieves full case details with beneficiary info, clinical trajectory history, and interventions.
- `POST /counsellor/cases/{case_ref}/interventions` — Records a human counsellor intervention action.
- `PATCH /counsellor/cases/{case_ref}/notes` — Updates clinical notes for a case.
- `GET /counsellor/alerts` — Lists all triage alerts across beneficiaries (`?unread_only=true` supported).
- `PATCH /counsellor/alerts/{alert_id}/read` — Marks an alert as read/reviewed.
- `GET /counsellor/stats` — Aggregate metrics: total cases, high/moderate/low risk counts, cases needing review, unread alerts.

### AI Inference & Companion
- `POST /predict` — Multimodal distress prediction: Isolation Forest + DistilRoBERTa + Gemini reflection.
- `POST /chat` — Saathi companion chat with Gemini 2.5 Flash + emotion extraction.
- `POST /counsellor/ai-summary` — Generates clinical synthesis brief using Google Gemini.
- `GET /health` — Health check status.
- `GET /gemini-status` — Gemini model configuration and status.

---

## 6. How to Run & Verify the Project

### Prerequisites
- Python 3.13 installed with `.venv` at project root
- PostgreSQL 18 running on port 5433 with database `saathi_db` (credentials configured in `bytepulse-ai-engine/.env`)
- Node.js (v18+) & npm

### Starting the Backend (Port 8000)
```powershell
.\.venv\Scripts\uvicorn main:app --reload --app-dir bytepulse-ai-engine --port 8000
```

### Starting the Frontend (Port 5173)
```powershell
cd saathi
npm run dev
```

### Running the End-to-End Test Suite
To verify all 12 authentication, authorization, role guards, and PostgreSQL database operations:
```powershell
.\.venv\Scripts\python bytepulse-ai-engine/test_auth_db_endpoints.py
```
Expected output:
```
ALL 12 AUTHENTICATION, AUTHORIZATION & POSTGRESQL TESTS PASSED!
```
