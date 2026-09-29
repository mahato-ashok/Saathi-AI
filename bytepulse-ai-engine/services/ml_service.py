"""
services/ml_service.py — Multimodal Distress & Anomaly Detection Service
Combines:
  1. Scikit-Learn Isolation Forest (Behavioral Telemetry Anomaly Detection)
  2. Hugging Face DistilRoBERTa (Natural Language Emotion Distress Classification)
"""
from typing import Tuple, Dict, Any
from pathlib import Path
import joblib
import numpy as np
from transformers import pipeline

from core.config import settings

_behavior_model = None
_nlp_model = None


def get_behavior_model():
    """Singleton getter for the behavioral anomaly model."""
    global _behavior_model
    if _behavior_model is None:
        model_path = settings.BEHAVIORAL_MODEL_PATH
        if model_path.exists():
            print(f"[ML Service] Loading Behavioral Anomaly Model from {model_path}...")
            _behavior_model = joblib.load(str(model_path))
        else:
            raise FileNotFoundError(f"Behavioral anomaly model not found at {model_path}")
    return _behavior_model


def get_nlp_model():
    """Singleton getter for the DistilRoBERTa emotion classification pipeline."""
    global _nlp_model
    if _nlp_model is None:
        print(f"[ML Service] Loading NLP Model ({settings.NLP_MODEL_NAME})...")
        _nlp_model = pipeline(
            "text-classification",
            model=settings.NLP_MODEL_NAME,
            top_k=None,
        )
    return _nlp_model


def run_analysis(
    screen_time_hours: float,
    missed_checkins: int,
    late_night_hours: float,
    text_input: str = "",
) -> Tuple[float, str, str, Dict[str, float]]:
    """
    Executes multimodal distress analysis combining behavioral telemetry and text emotion analysis.

    Returns:
        (total_risk_score, risk_category, behavior_status, distress_scores)
    """
    behavior_model = get_behavior_model()
    nlp_model = get_nlp_model()

    total_risk_score = 0.0

    # 1. Behavioral Anomaly Detection (Isolation Forest)
    user_metrics = np.array([[screen_time_hours, missed_checkins, late_night_hours]])
    behavior_prediction = behavior_model.predict(user_metrics)[0]
    behavior_status = "Anomalous" if behavior_prediction == -1 else "Normal"
    if behavior_status == "Anomalous":
        total_risk_score += 30.0

    # 2. Emotion Distress Classification (DistilRoBERTa)
    distress_scores = {}
    if text_input and text_input.strip():
        raw_results = nlp_model(text_input[:512])
        emotion_list = raw_results[0] if isinstance(raw_results[0], list) else raw_results
        for emotion in emotion_list:
            if emotion["label"] in ["fear", "sadness", "anger"]:
                distress_scores[emotion["label"]] = round(float(emotion["score"]), 4)

    nlp_risk = sum(distress_scores.values()) * 40.0
    total_risk_score += nlp_risk

    # 3. Categorize Risk Level
    if total_risk_score >= 60.0:
        category = "High Risk"
    elif total_risk_score >= 35.0:
        category = "Moderate Risk"
    else:
        category = "Low Risk"

    return total_risk_score, category, behavior_status, distress_scores


def extract_text_emotions(text: str) -> Dict[str, float]:
    """Helper to extract all emotion scores for a text string."""
    if not text or not text.strip():
        return {}
    nlp_model = get_nlp_model()
    raw = nlp_model(text[:512])
    emotion_list = raw[0] if isinstance(raw[0], list) else raw
    return {e["label"]: round(float(e["score"]), 4) for e in emotion_list}
