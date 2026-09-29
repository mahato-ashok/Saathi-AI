"""
services/gemini_service.py — Google Gemini Generative AI Service
Provides:
  1. Multi-model fallback cascade (gemini-2.5-flash -> fallback models)
  2. Saathi Empathetic Companion Chatbot with context and safety guardrails
  3. Personalized Check-In Validation Reflections
  4. Counsellor Clinical Case Synthesis Briefs
"""
import warnings
from typing import List, Dict, Any, Tuple, Optional

# Suppress deprecation warnings for cleaner log outputs
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")
import google.generativeai as genai

from core.config import settings

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


SAATHI_SYSTEM_PROMPT = """You are Saathi, a compassionate AI wellness companion designed to support survivors of domestic violence and people in emotional distress.

Your role:
- Listen actively and respond with deep empathy, warmth, and non-judgment
- Validate the user's feelings before offering any suggestions
- Keep responses concise (2-4 sentences max) and conversational
- Gently detect emotional signals: sadness, fear, anxiety, anger, loneliness, hopelessness
- Never give clinical diagnoses - you are a supportive companion, not a therapist
- If the user mentions self-harm, suicide, or being in danger, IMMEDIATELY provide crisis resources:
  iCall: 9152987821 | Vandrevala Foundation: 1860-2662-345 | AASRA: 9820466627
- Speak in simple, warm English. Use heart emoji occasionally but not excessively (💙)
- Do NOT ask multiple questions at once. Ask one gentle follow-up at most
- Never dismiss, minimize, or question the validity of their feelings
- Remember context from the conversation history

You are part of the Saathi AI distress monitoring system. Your conversations help detect emotional signals that feed into the user wellbeing score - but never mention scoring or monitoring to the user."""


def sanitize_gemini_history(messages: List[Any]) -> List[Dict[str, Any]]:
    """Sanitizes chat history into alternating user/model turns expected by Gemini."""
    clean_history = []
    past = messages[:-1] if messages else []
    last_role = None
    for m in past:
        role = "user" if getattr(m, "role", "") in ("user", "human") else "model"
        text = (getattr(m, "content", "") or "").strip()
        if not text:
            continue
        if role == last_role and clean_history:
            clean_history[-1]["parts"][0] += f"\n{text}"
        else:
            clean_history.append({"role": role, "parts": [text]})
            last_role = role
    return clean_history


def call_gemini_chat(
    history_turns: List[Dict[str, Any]],
    new_message: str,
    system_instruction: str = "",
) -> Tuple[Optional[str], str, bool]:
    """Attempts to generate a conversational response via Gemini candidate models in cascade."""
    if not settings.GEMINI_API_KEY:
        return None, "No Gemini API key configured", False

    last_err = ""
    for model_name in settings.candidate_gemini_models:
        try:
            model = genai.GenerativeModel(model_name=model_name, system_instruction=system_instruction)
            chat_session = model.start_chat(history=history_turns)
            response = chat_session.send_message(new_message)
            if response and response.text:
                return response.text.strip(), model_name, False
        except Exception as e:
            last_err = str(e)
            print(f"[Gemini fallback] Model '{model_name}' encountered: {last_err[:120]}")
            continue

    is_rate_limited = "429" in last_err or "quota" in last_err.lower() or "resourceexhausted" in last_err.lower()
    return None, last_err, is_rate_limited


def call_gemini_generate(prompt: str, system_instruction: str = "") -> Tuple[Optional[str], str]:
    """Attempts one-shot content generation using the Gemini candidate model cascade."""
    if not settings.GEMINI_API_KEY:
        return None, "No Gemini API key configured"

    last_err = ""
    for model_name in settings.candidate_gemini_models:
        try:
            model = genai.GenerativeModel(model_name=model_name, system_instruction=system_instruction)
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip(), model_name
        except Exception as e:
            last_err = str(e)
            print(f"[Gemini fallback generate] Model '{model_name}' encountered: {last_err[:120]}")
            continue
    return None, last_err


def generate_checkin_reflection(
    category: str,
    score: float,
    mood_score: Optional[float],
    sleep_score: Optional[float],
    anxiety_score: Optional[float],
    text_note: str,
) -> Tuple[Optional[str], Optional[str]]:
    """Generates a warm, supportive 2-sentence validation response for a submitted check-in."""
    if not (text_note and text_note.strip() and settings.GEMINI_API_KEY):
        return None, None

    prompt = (
        f"A beneficiary in our wellness program submitted a check-in.\n"
        f"Risk Level: {category} (Distress Score: {round(score, 1)}/100)\n"
        f"Mood score: {mood_score or 'N/A'}/5, Sleep: {sleep_score or 'N/A'}/5, Anxiety: {anxiety_score or 'N/A'}/5.\n"
        f"Beneficiary's personal note: \"{text_note.strip()}\".\n\n"
        f"Write a warm, deeply validating, and supportive 2-sentence response directly to the beneficiary. "
        f"Never give clinical diagnoses. Speak with gentle care and reassurance."
    )
    reply, used_m = call_gemini_generate(
        prompt=prompt,
        system_instruction="You are Saathi, an empathetic AI wellness companion for survivors and individuals in emotional distress. Keep your reply to 2 gentle sentences with a blue heart emoji."
    )
    return reply, used_m


def generate_counsellor_summary(
    case_id: str,
    name: str,
    age: Optional[int],
    score: float,
    risk_level: str,
    trend: Optional[str],
    indicators: Optional[dict],
    notes: Optional[str],
    history: Optional[List[dict]],
    alerts_count: Optional[int],
) -> Tuple[str, str]:
    """Uses Google Gemini to generate a structured clinical case brief for counsellors."""
    indicators_str = ", ".join(f"{k}: {v}" for k, v in (indicators or {}).items()) or "None recorded"
    history_str = ", ".join(f"{h.get('d', '')}: {h.get('score', '')}" for h in (history or [])[-5:]) or "N/A"

    prompt = (
        f"You are a clinical wellness assistant advising a human counsellor reviewing a distress case.\n"
        f"Case ID: {case_id}\n"
        f"Beneficiary: {name}, Age: {age or 25}\n"
        f"Current Distress Score: {score}/100 ({risk_level})\n"
        f"Distress Trend: {trend or 'stable'}\n"
        f"Reported Indicators: {indicators_str}\n"
        f"Recent History: {history_str}\n"
        f"Open Alerts: {alerts_count or 0}\n"
        f"Latest Context Note: \"{notes or 'No optional note provided.'}\"\n\n"
        f"Provide a structured assessment formatted with these exact sections:\n"
        f"1. CLINICAL OVERVIEW (2-3 sentences analyzing trajectory and risk level)\n"
        f"2. KEY CONCERNS (2-3 concise bullet points)\n"
        f"3. RECOMMENDED ACTIONS (2-3 prioritized next steps for the human counsellor)"
    )

    summary_text, model_used = call_gemini_generate(
        prompt=prompt,
        system_instruction="You are an expert mental health clinical triage assistant providing objective, supportive, and actionable summaries for licensed counsellors. Maintain high professional standards and non-alarmist, empathetic tone."
    )

    if not summary_text:
        summary_text = (
            f"CLINICAL OVERVIEW:\n"
            f"Case {case_id} presents with a distress score of {score}/100 categorized as {risk_level} with a {trend or 'stable'} trajectory. "
            f"Reported indicators ({indicators_str}) warrant proactive human review.\n\n"
            f"KEY CONCERNS:\n"
            f"• Elevated distress metrics in recent check-ins\n"
            f"• Reported strain in sleep and anxiety indicators\n\n"
            f"RECOMMENDED ACTIONS:\n"
            f"• Initiate a supportive check-in call within 24 hours\n"
            f"• Review and update personalized safety plan with the beneficiary"
        )
        model_used = "Offline Protocol Template"

    return summary_text, model_used
