// ─────────────────────────────────────────────────────────────────────────────
// STORAGE & INITIAL DATA
// ─────────────────────────────────────────────────────────────────────────────
export const STORAGE_KEY = 'saathi-ai-v4';
const LEGACY_STORAGE_KEY = 'Saathi AI-v4';

export const SEED_DATA = {
  profile: {
    name: 'Ananya Sharma',
    age: 29,
    location: 'Community Support Program',
    avatar: 'AS',
    streak: 5,
    joinDate: 'Aug 2026',
    // 'YYYY-MM-DD' of the last completed check-in (null = never done)
    lastCheckinDate: null,
    // The base score set by the most recent daily check-in (for chat nudge blending)
    checkinBaseScore: 68,
  },
  checkins: [
    {
      id: 'ci-006', date: 'Sep 14', fullDate: 'Sep 14, 2026',
      score: 68, level: 'Moderate',
      mood: 2, safety: 2, sleep: 2, anxiety: 4, support: 2,
      note: 'Feeling overwhelmed about the week ahead. Sleep has been poor.',
      submittedAt: '08:34 AM',
    },
    {
      id: 'ci-005', date: 'Sep 11', fullDate: 'Sep 11, 2026',
      score: 54, level: 'Moderate',
      mood: 3, safety: 3, sleep: 2, anxiety: 3, support: 2,
      note: '',
      submittedAt: '09:12 AM',
    },
    {
      id: 'ci-004', date: 'Sep 8', fullDate: 'Sep 8, 2026',
      score: 41, level: 'Low',
      mood: 4, safety: 4, sleep: 3, anxiety: 2, support: 3,
      note: 'Better week overall.',
      submittedAt: '10:05 AM',
    },
    {
      id: 'ci-003', date: 'Sep 5', fullDate: 'Sep 5, 2026',
      score: 47, level: 'Low',
      mood: 3, safety: 4, sleep: 3, anxiety: 2, support: 3,
      note: '',
      submittedAt: '08:50 AM',
    },
    {
      id: 'ci-002', date: 'Sep 2', fullDate: 'Sep 2, 2026',
      score: 38, level: 'Low',
      mood: 4, safety: 4, sleep: 4, anxiety: 1, support: 4,
      note: '',
      submittedAt: '09:00 AM',
    },
    {
      id: 'ci-001', date: 'Aug 30', fullDate: 'Aug 30, 2026',
      score: 45, level: 'Low',
      mood: 3, safety: 4, sleep: 3, anxiety: 2, support: 3,
      note: '',
      submittedAt: '09:20 AM',
    },
  ],
  cases: [
    {
      id: 'ST-1042', name: 'Ananya Sharma', age: 29, area: 'Community Support',
      score: 68, risk: 'Moderate', status: 'Needs review',
      updated: 'Just now', trend: 'rising', alerts: 2,
      notes: 'Feeling overwhelmed about the week ahead. Sleep has been poor.',
      indicators: { mood: 'Low', sleep: 'Poor', anxiety: 'Elevated', support: 'Limited' },
      interventions: [],
      history: [
        { d: 'Aug 30', score: 45 }, { d: 'Sep 2', score: 38 },
        { d: 'Sep 5', score: 47 }, { d: 'Sep 8', score: 41 },
        { d: 'Sep 11', score: 54 }, { d: 'Sep 14', score: 68 }
      ],
    },
    {
      id: 'ST-1038', name: 'Rohan Das', age: 34, area: 'District Outreach',
      score: 61, risk: 'Moderate', status: 'In follow-up',
      updated: '18 min ago', trend: 'stable', alerts: 1,
      notes: 'Sleep has been inconsistent. Mentioned stress from work.',
      indicators: { mood: 'Moderate', sleep: 'Irregular', anxiety: 'Mild', support: 'Partial' },
      interventions: [
        { id: 'iv-1', date: 'Sep 14', type: 'Check-in call', note: 'Scheduled for tomorrow morning. Beneficiary agreed.', counsellor: 'Dr. Kavya' }
      ],
      history: [
        { d: 'Sep 1', score: 55 }, { d: 'Sep 4', score: 58 },
        { d: 'Sep 7', score: 60 }, { d: 'Sep 10', score: 62 },
        { d: 'Sep 13', score: 61 }
      ],
    },
    {
      id: 'ST-1029', name: 'Meera Kumari', age: 24, area: 'Community Support',
      score: 82, risk: 'High', status: 'Escalated',
      updated: '1 hr ago', trend: 'rising', alerts: 4,
      notes: 'Reported persistent distress. Safety concern flagged. Support network limited.',
      indicators: { mood: 'Very Low', sleep: 'Very Poor', anxiety: 'High', support: 'Absent' },
      interventions: [
        { id: 'iv-2', date: 'Sep 14', type: 'Counsellor call', note: 'Safety plan reviewed and documented.', counsellor: 'Dr. Kavya' },
        { id: 'iv-3', date: 'Sep 13', type: 'Safety plan review', note: 'Updated safety plan shared with beneficiary.', counsellor: 'Dr. Ravi' }
      ],
      history: [
        { d: 'Sep 1', score: 62 }, { d: 'Sep 4', score: 68 },
        { d: 'Sep 7', score: 71 }, { d: 'Sep 10', score: 76 },
        { d: 'Sep 14', score: 82 }
      ],
    },
    {
      id: 'ST-1018', name: 'Vikram Singh', age: 41, area: 'Rural Outreach',
      score: 44, risk: 'Low', status: 'Monitoring',
      updated: '3 hr ago', trend: 'falling', alerts: 0,
      notes: 'Stable week. Mood improving. Sleep still variable.',
      indicators: { mood: 'Fair', sleep: 'Variable', anxiety: 'Low', support: 'Good' },
      interventions: [],
      history: [
        { d: 'Sep 1', score: 62 }, { d: 'Sep 4', score: 57 },
        { d: 'Sep 7', score: 51 }, { d: 'Sep 10', score: 48 },
        { d: 'Sep 14', score: 44 }
      ],
    },
    {
      id: 'ST-1007', name: 'Priya Nair', age: 31, area: 'District Outreach',
      score: 57, risk: 'Moderate', status: 'In follow-up',
      updated: 'Yesterday', trend: 'stable', alerts: 1,
      notes: 'Anxiety reported during evenings. Work situation unclear.',
      indicators: { mood: 'Moderate', sleep: 'Mixed', anxiety: 'Moderate', support: 'Partial' },
      interventions: [
        { id: 'iv-4', date: 'Sep 13', type: 'Follow-up message', note: 'Sent wellness resources and scheduled next check-in.', counsellor: 'Dr. Kavya' }
      ],
      history: [
        { d: 'Sep 1', score: 55 }, { d: 'Sep 4', score: 57 },
        { d: 'Sep 7', score: 58 }, { d: 'Sep 10', score: 56 },
        { d: 'Sep 14', score: 57 }
      ],
    },
    {
      id: 'ST-0998', name: 'Sita Devi', age: 52, area: 'Community Support',
      score: 33, risk: 'Low', status: 'Stable',
      updated: '2 days ago', trend: 'falling', alerts: 0,
      notes: 'Good improvement noted. Engaged in community activities.',
      indicators: { mood: 'Good', sleep: 'Good', anxiety: 'Low', support: 'Strong' },
      interventions: [],
      history: [
        { d: 'Sep 1', score: 55 }, { d: 'Sep 4', score: 48 },
        { d: 'Sep 7', score: 41 }, { d: 'Sep 10', score: 36 },
        { d: 'Sep 14', score: 33 }
      ],
    },
  ],
  weeklyStats: [
    { day: 'Mon', low: 8, moderate: 6, high: 2 },
    { day: 'Tue', low: 10, moderate: 7, high: 2 },
    { day: 'Wed', low: 9, moderate: 8, high: 3 },
    { day: 'Thu', low: 11, moderate: 7, high: 3 },
    { day: 'Fri', low: 12, moderate: 9, high: 2 },
    { day: 'Sat', low: 11, moderate: 8, high: 4 },
    { day: 'Sun', low: 13, moderate: 10, high: 3 },
  ],
  alerts: [
    {
      id: 'al-001', caseId: 'ST-1029', name: 'Meera Kumari',
      type: 'High distress', severity: 'critical',
      message: 'Distress score rose sharply to 82. Safety signal detected.',
      time: '1 hr ago', read: false,
    },
    {
      id: 'al-002', caseId: 'ST-1042', name: 'Ananya Sharma',
      type: 'Score increase', severity: 'warning',
      message: 'Distress score increased from 54 to 68 in latest check-in.',
      time: 'Just now', read: false,
    },
    {
      id: 'al-003', caseId: 'ST-1038', name: 'Rohan Das',
      type: 'Missed check-in', severity: 'info',
      message: 'No check-in response in 4 days. Consider follow-up.',
      time: '18 min ago', read: false,
    },
    {
      id: 'al-004', caseId: 'ST-1007', name: 'Priya Nair',
      type: 'Elevated anxiety', severity: 'warning',
      message: 'Anxiety signal consistently elevated across 3 check-ins.',
      time: 'Yesterday', read: true,
    },
  ],
};

export function getUserStorageKey(email) {
  return email ? `saathi-state-${email}` : STORAGE_KEY;
}

export function loadState(email = null) {
  try {
    if (email) {
      const userSaved = localStorage.getItem(`saathi-state-${email}`);
      if (userSaved) return JSON.parse(userSaved);
    }
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : SEED_DATA;
  } catch {
    return SEED_DATA;
  }
}

export function saveState(s, email = null) {
  try {
    if (email) {
      localStorage.setItem(`saathi-state-${email}`, JSON.stringify(s));
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { }
}

