# 🚀 BytePulse AI Engine (SIH 26094)
> **AI-Powered Dynamic Mental Health Monitoring and Distress Prediction System for Victims of Atrocities**

---

## 🛠️ Project Architecture
This repository contains the backend and machine learning pipeline for **BytePulse**, combining:
1. **Behavioral Anomaly Detection:** An unsupervised **Isolation Forest** model tracking patterns like screen time, missed check-ins, and late-night activity.
2. **Text Emotion Analysis (NLP):** A pre-trained Hugging Face Transformer (`j-hartmann/emotion-english-distilroberta-base`) extracting precise distress weights (fear, sadness, anger).
3. **Conversational & Clinical AI (Google Gemini):** Powered by `gemini-2.5-flash` with a resilient multi-model fallback cascade providing empathetic companion dialogues, personalized check-in reflections, and counsellor clinical briefs.
4. **Dynamic Risk Scoring Engine:** Fuses behavioral, NLP, and conversational features into real-time risk scores ($0-100$) and categorizes risk levels via **FastAPI**.

---

## ⚙️ Quick Start

### 1. Environment Configuration
Create or update `bytepulse-ai-engine/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the FastAPI Server
```bash
python -m uvicorn main:app --reload --port 8000
```

### 4. Interactive API Documentation
Open your browser at:
* **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
* **Gemini Status:** [http://127.0.0.1:8000/gemini-status](http://127.0.0.1:8000/gemini-status)

---
