"""
Services package: ML distress analysis and Gemini AI companion services.
"""
from services.ml_service import run_analysis, extract_text_emotions, get_behavior_model, get_nlp_model
from services.gemini_service import (
    call_gemini_chat,
    call_gemini_generate,
    generate_checkin_reflection,
    generate_counsellor_summary,
    sanitize_gemini_history,
    SAATHI_SYSTEM_PROMPT,
)

__all__ = [
    "run_analysis",
    "extract_text_emotions",
    "get_behavior_model",
    "get_nlp_model",
    "call_gemini_chat",
    "call_gemini_generate",
    "generate_checkin_reflection",
    "generate_counsellor_summary",
    "sanitize_gemini_history",
    "SAATHI_SYSTEM_PROMPT",
]
