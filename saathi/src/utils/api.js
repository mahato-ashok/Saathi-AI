const BASE = '/api';   // proxied to FastAPI via vite.config.js → http://127.0.0.1:8000

/**
 * Returns common headers including Authorization Bearer token if logged in.
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('saathi-auth-token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ══════════════════════════════════════════════════════════════════════════════
// Authentication Endpoints
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Registers a new user (beneficiary or counsellor).
 * @param {Object} data - { email, password, full_name, role, age?, area? }
 * @returns {Promise<{ access_token: string, token_type: string, user: Object }>}
 */
export async function authRegister(data) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Registration failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * Logs in an existing user.
 * @param {string} email
 * @param {string} password
 * @param {string} role - 'beneficiary' | 'counsellor'
 * @returns {Promise<{ access_token: string, token_type: string, user: Object }>}
 */
export async function authLogin(email, password, role) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Login failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches the current authenticated user's profile.
 */
export async function authGetMe() {
  const res = await fetch(`${BASE}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch current user profile');
  }
  return res.json();
}

/**
 * Updates profile fields (full_name, age, area).
 */
export async function authUpdateMe(data) {
  const res = await fetch(`${BASE}/auth/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update profile');
  }
  return res.json();
}

// ══════════════════════════════════════════════════════════════════════════════
// Beneficiary Endpoints (PostgreSQL backed)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Persists a completed check-in to the PostgreSQL database.
 * Updates streak, creates alerts if high distress, and appends to case history.
 */
export async function saveBeneficiaryCheckin(data) {
  const res = await fetch(`${BASE}/beneficiary/checkins`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to save checkin: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches historical check-ins for the logged-in beneficiary.
 */
export async function fetchBeneficiaryCheckins(limit = 30) {
  const res = await fetch(`${BASE}/beneficiary/checkins?limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load checkin history');
  }
  return res.json();
}

/**
 * Fetches the beneficiary's associated case and clinical timeline.
 */
export async function fetchBeneficiaryCase() {
  const res = await fetch(`${BASE}/beneficiary/case`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load case data');
  }
  return res.json();
}

/**
 * Fetches active alerts for the current beneficiary.
 */
export async function fetchBeneficiaryAlerts() {
  const res = await fetch(`${BASE}/beneficiary/alerts`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load beneficiary alerts');
  }
  return res.json();
}

/**
 * Fetches saved chat messages for the current beneficiary.
 */
export async function fetchBeneficiaryChatHistory(limit = 50) {
  const res = await fetch(`${BASE}/beneficiary/chat-history?limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load chat history');
  }
  return res.json();
}

// ══════════════════════════════════════════════════════════════════════════════
// Counsellor Endpoints (PostgreSQL backed)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Fetches all cases for counsellor triage.
 * @param {string?} riskFilter - 'Low' | 'Moderate' | 'High'
 */
export async function fetchCounsellorCases(riskFilter = null, limit = 50, offset = 0) {
  let url = `${BASE}/counsellor/cases?limit=${limit}&offset=${offset}`;
  if (riskFilter && riskFilter !== 'All') {
    url += `&risk=${encodeURIComponent(riskFilter)}`;
  }
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load cases');
  }
  return res.json();
}

/**
 * Fetches complete details of a single case by reference (e.g. ST-1042).
 */
export async function fetchCounsellorCase(caseRef) {
  const res = await fetch(`${BASE}/counsellor/cases/${encodeURIComponent(caseRef)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Case not found');
  }
  return res.json();
}

/**
 * Records a human counsellor intervention for a case.
 */
export async function createCounsellorIntervention(caseRef, data) {
  const res = await fetch(`${BASE}/counsellor/cases/${encodeURIComponent(caseRef)}/interventions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to record intervention');
  }
  return res.json();
}

/**
 * Updates counsellor clinical notes for a case.
 */
export async function updateCounsellorCaseNotes(caseRef, notes) {
  const res = await fetch(`${BASE}/counsellor/cases/${encodeURIComponent(caseRef)}/notes`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update notes');
  }
  return res.json();
}

/**
 * Fetches all alerts across beneficiaries for the counsellor team.
 */
export async function fetchCounsellorAlerts(unreadOnly = false) {
  const url = `${BASE}/counsellor/alerts${unreadOnly ? '?unread_only=true' : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load counsellor alerts');
  }
  return res.json();
}

/**
 * Marks an alert as read/reviewed.
 */
export async function markAlertRead(alertId) {
  const res = await fetch(`${BASE}/counsellor/alerts/${encodeURIComponent(alertId)}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update alert');
  }
  return res.json();
}

/**
 * Fetches aggregate statistics for the counsellor overview.
 */
export async function fetchCounsellorStats() {
  const res = await fetch(`${BASE}/counsellor/stats`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load counsellor stats');
  }
  return res.json();
}

// ══════════════════════════════════════════════════════════════════════════════
// AI Inference & Companion APIs (BytePulse + Google Gemini)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calls BytePulse /predict endpoint (Isolation Forest + DistilRoBERTa + Gemini Reflection).
 * @param {Object} answers  - { mood, safety, sleep, anxiety, support } (1–5 scale)
 * @param {string} note     - optional free-text journal note
 */
export async function analyseCheckin(answers, note = '') {
  const payload = {
    screen_time:         mapToHours(answers.sleep),       // sleep quality → proxy screen time
    missed_checkins:     mapMissed(answers.support),       // support level → missed check-ins proxy
    late_night_activity: mapLateNight(answers.anxiety),    // anxiety → late-night activity probability
    mood_score:          answers.mood,                     // 1–5 direct mood rating
    safety_score:        answers.safety,                   // 1–5 safety rating
    sleep_score:         answers.sleep,
    anxiety_score:       answers.anxiety,
    support_score:       answers.support,
    text:                note || '',                       // optional journal text for NLP + Gemini
  };

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 18_000);

  try {
    const res = await fetch(`${BASE}/predict`, {
      method:  'POST',
      headers: getAuthHeaders(),
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`BytePulse API error ${res.status}: ${errText}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Generates an AI clinical summary for counsellors using Google Gemini.
 * @param {Object} caseData
 */
export async function fetchCounsellorSummary(caseData) {
  const payload = {
    case_id:      caseData.id || caseData.case_ref,
    name:         caseData.name,
    age:          caseData.age || 25,
    score:        caseData.score,
    risk_level:   caseData.risk,
    trend:        caseData.trend || 'stable',
    indicators:   caseData.indicators || {},
    notes:        caseData.notes || '',
    history:      caseData.history || [],
    alerts_count: caseData.alerts || caseData.open_alerts || 0,
  };

  const res = await fetch(`${BASE}/counsellor/ai-summary`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify(payload),
    signal:  AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Counsellor summary error ${res.status}`);
  }
  return res.json();
}

/**
 * Checks Google Gemini engine status.
 */
export async function fetchGeminiStatus() {
  try {
    const res = await fetch(`${BASE}/gemini-status`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { active: false, provider: 'Unknown' };
    return res.json();
  } catch {
    return { active: false, provider: 'Offline' };
  }
}

// ── Mapping helpers: translate 1-5 Likert scale → model's expected numeric ranges ──

/**
 * Maps sleep quality (1=very poor → 5=very good) to proxy screen-time hours.
 */
export function mapToHours(sleepScore) {
  return Math.round(14 - (sleepScore || 3) * 2.2);
}

/**
 * Maps social support score (1=not supported → 5=very supported) to missed check-ins proxy.
 */
export function mapMissed(supportScore) {
  return Math.max(0, Math.round(4 - (supportScore || 3) * 0.8));
}

/**
 * Maps anxiety level (1=none → 5=very high) to late-night activity probability.
 */
export function mapLateNight(anxietyScore) {
  return parseFloat((((anxietyScore || 1) - 1) / 4 * 0.85 + 0.05).toFixed(2));
}
