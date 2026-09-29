"""
routes/ai_routes.py — Multimodal Distress Prediction, Chatbot Companion & Clinical Briefs
Endpoints:
  - POST /predict: Combined Behavioral + Emotion distress scoring with Gemini reflection
  - POST /analyze-distress: Behavioral + Text analysis breakdown
  - POST /chat-analyze: Chat-session distress telemetry analysis
  - POST /counsellor/ai-summary: Gemini-powered clinical case brief synthesis
  - POST /chat: Empathetic AI Companion ("Saathi") chat with emotion telemetry and fallback cascade
"""
from fastapi import APIRouter
from core.config import settings
from core.database import AsyncSessionLocal
from models import ChatMessage as DBChatMessage
from schemas import (
    VictimData,
    CheckinPayload,
    ChatPayload,
    ChatRequest,
    CaseSummaryRequest,
)
from services.ml_service import run_analysis, get_nlp_model
from services.gemini_service import (
    generate_checkin_reflection,
    generate_counsellor_summary,
    call_gemini_chat,
    sanitize_gemini_history,
    SAATHI_SYSTEM_PROMPT,
)

router = APIRouter(tags=["AI & ML Engine"])


@router.post("/predict")
def predict(data: CheckinPayload):
    """
    Multimodal distress prediction:
    1. Isolation Forest behavioral anomaly detection
    2. DistilRoBERTa emotion classification
    3. Gemini empathetic reflection note
    """
    late_night_hours = round(data.late_night_activity * 8, 2)
    score, category, behavior_status, distress_scores = run_analysis(
        screen_time_hours=data.screen_time,
        missed_checkins=data.missed_checkins,
        late_night_hours=late_night_hours,
        text_input=data.text or "",
    )

    gemini_reflection = None
    reflection_model = None
    if data.text and data.text.strip():
        gemini_reflection, reflection_model = generate_checkin_reflection(
            category=category,
            score=score,
            mood_score=data.mood_score,
            sleep_score=data.sleep_score,
            anxiety_score=data.anxiety_score,
            text_note=data.text.strip(),
        )

    return {
        "risk_score": round(score, 2),
        "risk_level": category,
        "emotions": distress_scores,
        "anomaly_flag": behavior_status == "Anomalous",
        "gemini_reflection": gemini_reflection,
        "gemini_model": reflection_model,
        "ai_provider": "Google Gemini" if gemini_reflection else "DistilRoBERTa + Isolation Forest",
    }


@router.post("/analyze-distress")
def analyze_distress(data: VictimData):
    """Direct distress score and category breakdown for behavioral and text metrics."""
    score, category, behavior_status, distress_scores = run_analysis(
        screen_time_hours=data.screen_time_hours,
        missed_checkins=data.missed_checkins,
        late_night_hours=data.late_night_hours,
        text_input=data.text_input,
    )
    return {
        "risk_category": category,
        "dynamic_score": round(score, 2),
        "breakdown": {"behavior": behavior_status, "text_emotions": distress_scores},
        "ai_provider": "BytePulse Engine",
    }


@router.post("/chat-analyze")
def chat_analyze(data: ChatPayload):
    """Analyzes combined transcript and note metrics from a chat session."""
    combined_text = " ".join(filter(None, [data.transcript, data.note])).strip()
    late_night_hours = round(data.late_night_activity * 8, 2)
    score, category, behavior_status, distress_scores = run_analysis(
        screen_time_hours=data.screen_time,
        missed_checkins=data.missed_checkins,
        late_night_hours=late_night_hours,
        text_input=combined_text,
    )
    return {
        "risk_score": round(score, 2),
        "risk_level": category,
        "emotions": distress_scores,
        "anomaly_flag": behavior_status == "Anomalous",
        "source": "chat-session",
        "ai_provider": "BytePulse Engine",
    }


@router.post("/counsellor/ai-summary")
def generate_ai_summary(req: CaseSummaryRequest):
    """Generates structured clinical synthesis briefs using Google Gemini."""
    summary_text, model_used = generate_counsellor_summary(
        case_id=req.case_id,
        name=req.name,
        age=req.age,
        score=req.score,
        risk_level=req.risk_level,
        trend=req.trend,
        indicators=req.indicators,
        notes=req.notes,
        history=req.history,
        alerts_count=req.alerts_count,
    )

    return {
        "case_id": req.case_id,
        "summary": summary_text,
        "model_used": model_used,
        "provider": "Google Gemini",
        "disclaimer": "AI-generated synthesis for qualified counsellor review only. Not a medical diagnosis.",
    }


@router.post("/chat")
async def chat(req: ChatRequest):
    """
    Google Gemini powered empathetic chatbot ('Saathi') with multi-model cascade,
    crisis safety protocols, real-time emotion telemetry, and DB persistence.
    """
    nlp = get_nlp_model()
    all_user_text = " ".join(m.content for m in req.messages if m.role in ("user", "human"))
    emotion_scores = {}
    if all_user_text.strip():
        raw = nlp(all_user_text[:512])
        emotion_list = raw[0] if isinstance(raw[0], list) else raw
        for e in emotion_list:
            emotion_scores[e["label"]] = round(e["score"], 4)

    distress_emotions = {k: v for k, v in emotion_scores.items() if k in ("fear", "sadness", "anger")}
    emotion_distress = round(sum(distress_emotions.values()) * 40, 2)

    last_user_msg = req.messages[-1].content if req.messages else ""

    CRISIS_KEYWORDS = [
        "suicide", "kill myself", "end my life", "self harm",
        "hurt myself", "want to die", "no reason to live"
    ]
    is_crisis = any(w in last_user_msg.lower() for w in CRISIS_KEYWORDS)

    reply = ""
    model_used = "Offline Fallback"
    rate_limited = False

    if settings.GEMINI_API_KEY:
        system_instruction = SAATHI_SYSTEM_PROMPT
        if req.user_context:
            system_instruction += f"\n\nContext for empathy: {req.user_context}"

        clean_history = sanitize_gemini_history(req.messages)
        gemini_reply, used_model, is_rate_limit = call_gemini_chat(
            history_turns=clean_history,
            new_message=last_user_msg,
            system_instruction=system_instruction,
        )

        if gemini_reply:
            reply = gemini_reply
            model_used = used_model
        else:
            rate_limited = is_rate_limit
            if is_crisis:
                reply = (
                    "I hear how much pain you are carrying right now, and I care deeply about your safety. "
                    "You do not have to walk through this alone. Please connect with these free, confidential lifelines immediately:\n\n"
                    "• iCall: 9152987821\n• Vandrevala Foundation: 1860-2662-345\n• AASRA: 9820466627 💙"
                )
            elif rate_limited:
                reply = (
                    "I'm right here with you 💙. Things might feel heavy right now, and I am listening. "
                    "Let's take a slow, gentle breath together. Could you tell me a little more about what's feeling hardest today?"
                )
            else:
                reply = (
                    "I hear you, and thank you for trusting me with this 💙. "
                    "It is completely valid to feel the way you do. I'm here to listen without judgment — please take your time."
                )
    else:
        if is_crisis:
            reply = "I care about your safety. Please connect with support: iCall: 9152987821 | AASRA: 9820466627 💙"
        else:
            reply = "I'm listening 💙. This is a private space — take a gentle breath and share whatever is on your mind."

    # Persist to DB if user_id is provided
    if req.user_id:
        try:
            async with AsyncSessionLocal() as db_session:
                user_msg_db = DBChatMessage(
                    user_id=req.user_id,
                    role="user",
                    content=last_user_msg,
                    emotions=distress_emotions,
                    distress_signal=emotion_distress,
                )
                db_session.add(user_msg_db)

                bot_msg_db = DBChatMessage(
                    user_id=req.user_id,
                    role="assistant",
                    content=reply,
                    emotions=None,
                    distress_signal=None,
                )
                db_session.add(bot_msg_db)
                await db_session.commit()
        except Exception as e:
            print(f"[Chat DB persist] Warning: {e}")

    return {
        "reply": reply,
        "emotions": emotion_scores,
        "distress_signal": emotion_distress,
        "model_used": model_used,
        "rate_limited": rate_limited,
        "ai_provider": "Google Gemini",
    }
