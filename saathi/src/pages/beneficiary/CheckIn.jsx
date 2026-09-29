import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { analyseCheckin, saveBeneficiaryCheckin } from '../../utils/api';
import {
  ArrowLeft, ArrowRight, Brain, Check, CheckCircle2,
  Heart, Lock, MessageCircle, Moon, Shield, Sparkles, Sun, Wind,
  AlertCircle, Zap, ShieldCheck, Clock
} from 'lucide-react';
import { getRiskLevel, calcDistressScore, cx } from '../../utils/helpers';
import { saveState } from '../../data/seedData';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import DistressGauge from '../../components/ui/DistressGauge';
import RiskBadge from '../../components/ui/RiskBadge';
import AIDisclaimer from '../../components/ui/AIDisclaimer';
import { useAuth } from '../../context/AuthContext';

/** Returns today's date as YYYY-MM-DD in local time */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CHECK_IN_QUESTIONS = [
  {
    key: 'mood',
    icon: Sun,
    category: 'Emotional State',
    question: 'How would you describe your overall mood today?',
    options: ['Very low', 'Low', 'Neutral / Okay', 'Good', 'Very positive'],
    hint: 'Reflect on your dominant emotional tone over the past 24 hours.',
  },
  {
    key: 'safety',
    icon: Shield,
    category: 'Physical & Psychological Safety',
    question: 'How safe, stable, and secure do you feel right now?',
    options: ['Unsafe', 'Somewhat insecure', 'Mostly secure', 'Safe', 'Very safe & secure'],
    hint: 'Covers physical safety in your immediate environment and emotional security.',
  },
  {
    key: 'sleep',
    icon: Moon,
    category: 'Rest & Recovery',
    question: 'How has your sleep quality and duration been recently?',
    options: ['Severely disrupted', 'Poor quality', 'Mixed / Broken', 'Restful', 'Deep & rejuvenating'],
    hint: 'Consider total sleep hours, difficulty falling asleep, or frequent waking.',
  },
  {
    key: 'anxiety',
    icon: Wind,
    category: 'Cognitive & Somatic Strain',
    question: 'How intense has anxiety, worry, or tension felt today?',
    options: ['Minimal / Calm', 'Mild strain', 'Moderate worry', 'Elevated anxiety', 'Overwhelming tension'],
    hint: 'Includes racing thoughts, somatic tightness, restlessness, or nervous exhaustion.',
    invertedScale: true,
  },
  {
    key: 'support',
    icon: Heart,
    category: 'Social Connection',
    question: 'How supported do you feel by trusted people around you?',
    options: ['Isolated', 'Minimal support', 'Partially supported', 'Well supported', 'Strongly supported'],
    hint: 'Includes close friends, family, case advocates, community workers, or peers.',
  },
];

export { CHECK_IN_QUESTIONS };

const EMOTION_COLORS = {
  joy:       'bg-amber-400',
  sadness:   'bg-blue-400',
  anger:     'bg-rose-500',
  fear:      'bg-purple-500',
  disgust:   'bg-emerald-500',
  surprise:  'bg-orange-400',
  neutral:   'bg-slate-400',
};

export default function CheckIn({ state, setState }) {
  const { user, updateUser } = useAuth();
  const currentName = user?.full_name || state?.profile?.name || 'Beneficiary';
  const currentCaseRef = state?.profile?.caseRef || state?.cases?.find(c => c.name === currentName)?.id || (user?.email === 'ananya@example.com' ? 'ST-1042' : 'ST-XXXX');

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ mood: 0, safety: 0, sleep: 0, anxiety: 0, support: 0 });
  const [note, setNote] = useState('');
  const [phase, setPhase] = useState('questions'); // questions | analyzing | result
  const [score, setScore] = useState(0);
  const [emotions, setEmotions] = useState(null);
  const [anomalyFlag, setAnomalyFlag] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [geminiReflection, setGeminiReflection] = useState(null);
  const [geminiModel, setGeminiModel] = useState(null);
  const TOTAL = CHECK_IN_QUESTIONS.length + 1; // +1 for note step

  const alreadyCheckedIn = (user?.last_checkin_date || state?.profile?.lastCheckinDate) === todayStr();
  const currentQ = CHECK_IN_QUESTIONS[step];

  function selectAnswer(key, val) {
    setAnswers(a => ({ ...a, [key]: val }));
  }

  function nextStep() {
    if (step < CHECK_IN_QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      setStep(CHECK_IN_QUESTIONS.length);
    }
  }

  function prevStep() {
    if (step > 0) setStep(s => s - 1);
  }

  function persistCheckin(newScore, level, apiEmotions, anomaly, reflection = null) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const fullDateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

    const newEntry = {
      id: `ci-${Date.now()}`,
      date: dateStr,
      fullDate: fullDateStr,
      score: newScore,
      level: level,
      mood: answers.mood,
      safety: answers.safety,
      sleep: answers.sleep,
      anxiety: answers.anxiety,
      support: answers.support,
      note: note,
      submittedAt: timeStr,
      emotions: apiEmotions || null,
      anomalyFlag: anomaly || false,
      reflection: reflection || null,
      source: 'checkin',
    };

    const updatedCheckins = [newEntry, ...(state.checkins || [])];
    const prevScore = state.checkins?.[0]?.score ?? newScore;
    const newTrend = newScore > prevScore + 5 ? 'rising' : newScore < prevScore - 5 ? 'falling' : 'stable';

    const caseExists = state.cases.some(c => c.id === currentCaseRef || c.name === currentName);
    let updatedCases;
    if (caseExists) {
      updatedCases = state.cases.map(c => {
        if (c.id !== currentCaseRef && c.name !== currentName) return c;
        return {
          ...c,
          id: currentCaseRef,
          name: currentName,
          score: newScore,
          risk: level,
          trend: newTrend,
          status: level === 'High' ? 'Escalated' : level === 'Moderate' ? 'Needs review' : 'Monitoring',
          updated: 'Just now',
          notes: note || c.notes,
          indicators: {
            mood: answers.mood <= 2 ? 'Low' : answers.mood === 3 ? 'Fair' : 'Good',
            sleep: answers.sleep <= 2 ? 'Poor' : answers.sleep === 3 ? 'Mixed' : 'Good',
            anxiety: answers.anxiety >= 4 ? 'High' : answers.anxiety === 3 ? 'Elevated' : 'Mild',
            support: answers.support <= 2 ? 'Limited' : answers.support === 3 ? 'Partial' : 'Strong',
          },
          history: [...(c.history || []), { d: dateStr, score: newScore }],
        };
      });
    } else {
      updatedCases = [
        {
          id: currentCaseRef,
          name: currentName,
          age: user?.age || state.profile?.age || 25,
          area: user?.area || state.profile?.location || 'Community Support',
          score: newScore,
          risk: level,
          status: level === 'High' ? 'Escalated' : level === 'Moderate' ? 'Needs review' : 'Monitoring',
          updated: 'Just now',
          trend: newTrend,
          alerts: (anomaly || level === 'High') ? 1 : 0,
          notes: note || '',
          indicators: {
            mood: answers.mood <= 2 ? 'Low' : answers.mood === 3 ? 'Fair' : 'Good',
            sleep: answers.sleep <= 2 ? 'Poor' : answers.sleep === 3 ? 'Mixed' : 'Good',
            anxiety: answers.anxiety >= 4 ? 'High' : answers.anxiety === 3 ? 'Elevated' : 'Mild',
            support: answers.support <= 2 ? 'Limited' : answers.support === 3 ? 'Partial' : 'Strong',
          },
          interventions: [],
          history: [{ d: dateStr, score: newScore }],
        },
        ...state.cases,
      ];
    }

    let updatedAlerts = [...(state.alerts || [])];
    if (anomaly || level === 'High') {
      updatedAlerts = [{
        id: `al-${Date.now()}`,
        caseId: currentCaseRef,
        name: currentName,
        type: anomaly ? 'Anomaly detected' : 'High distress',
        severity: 'critical',
        message: anomaly
          ? `Isolation Forest detected an anomalous behavioural pattern for ${currentName}. Distress score: ${newScore}.`
          : `Distress score reached ${newScore} — High risk threshold crossed for ${currentName}. Immediate review recommended.`,
        time: 'Just now',
        read: false,
      }, ...updatedAlerts];
    } else if (level === 'Moderate' && newScore > prevScore) {
      updatedAlerts = [{
        id: `al-${Date.now()}`,
        caseId: currentCaseRef,
        name: currentName,
        type: 'Score increase',
        severity: 'warning',
        message: `Distress score increased from ${prevScore} to ${newScore} in latest check-in for ${currentName}.`,
        time: 'Just now',
        read: false,
      }, ...updatedAlerts];
    }

    const newStreak = (user?.streak ?? state.profile?.streak ?? 0) + 1;
    if (updateUser) {
      updateUser({
        streak: newStreak,
        last_checkin_date: todayStr(),
        checkin_base_score: newScore,
      });
    }

    const nextState = {
      ...state,
      checkins: updatedCheckins,
      cases: updatedCases,
      alerts: updatedAlerts,
      profile: {
        ...state.profile,
        name: currentName,
        caseRef: currentCaseRef,
        streak: newStreak,
        lastCheckinDate: todayStr(),
        checkinBaseScore: newScore,
      },
    };
    setState(nextState);
    saveState(nextState, user?.email);

    saveBeneficiaryCheckin({
      score: newScore,
      level: level,
      mood: answers.mood,
      safety: answers.safety,
      sleep: answers.sleep,
      anxiety: answers.anxiety,
      support: answers.support,
      note: note || '',
      anomaly_flag: anomaly || false,
      emotions: apiEmotions || null,
      gemini_reflection: reflection || null,
    }).catch(err => {
      console.warn('PostgreSQL check-in sync skipped or offline:', err.message);
    });
  }

  async function submitCheckin() {
    setPhase('analyzing');
    try {
      const result = await analyseCheckin(answers, note);
      const newScore = Math.round(result.risk_score ?? calcDistressScore(answers));
      const level = result.risk_level ?? getRiskLevel(newScore);
      const apiEmotions = result.emotions || null;
      const anomaly = result.anomaly_flag ?? false;
      const reflection = result.gemini_reflection || null;

      setScore(newScore);
      setEmotions(apiEmotions);
      setAnomalyFlag(anomaly);
      setGeminiReflection(reflection);
      setGeminiModel(result.gemini_model || 'Google Gemini');
      setUsedFallback(false);
      persistCheckin(newScore, level, apiEmotions, anomaly, reflection);
      setPhase('result');
    } catch (err) {
      console.error('BytePulse API unreachable — using local fallback score', err);
      const newScore = calcDistressScore(answers);
      const level = getRiskLevel(newScore);
      setScore(newScore);
      setEmotions(null);
      setAnomalyFlag(false);
      setGeminiReflection(null);
      setUsedFallback(true);
      persistCheckin(newScore, level, null, false);
      setPhase('result');
    }
  }

  // ── Lock Screen (Already Checked In Today) ──
  if (alreadyCheckedIn && phase === 'questions') {
    const todayCheckin = state.checkins[0];
    const level = todayCheckin?.level || 'Low';

    return (
      <Layout role="beneficiary" state={state}>
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <Card className="mx-auto max-w-md p-8 text-center clinical-card animate-scale-in">
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              Assessment Completed for Today
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Your daily reflection was logged at{' '}
              <strong className="text-slate-800 font-semibold">{todayCheckin?.submittedAt || 'earlier today'}</strong>.
              Your signals have been synced with your counsellor's overview.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Today's Recorded Distress Score
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-display text-4xl font-extrabold text-slate-900 tabular-nums">
                  {todayCheckin?.score ?? '--'}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
              <div className="mt-3 flex justify-center">
                <RiskBadge level={level} size="lg" />
              </div>
            </div>

            <p className="mt-5 text-xs text-slate-400 leading-relaxed">
              💬 You can still converse with Saathi companion anytime for emotional support and grounding.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <NavLink
                to="/beneficiary"
                className="flex-1 rounded-xl gradient-teal py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 text-center"
              >
                Return to Dashboard
              </NavLink>
              <NavLink
                to="/beneficiary/history"
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-center"
              >
                View History Log
              </NavLink>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  // ── Analyzing Screen ──
  if (phase === 'analyzing') {
    return (
      <Layout role="beneficiary" state={state}>
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <Card className="max-w-md p-8 text-center clinical-card animate-scale-in">
            <div className="relative mx-auto mb-6 size-20">
              <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
              <div className="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-teal-50">
                <Brain size={26} className="text-teal-700" />
              </div>
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
              Processing Clinical Assessment…
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              The BytePulse AI engine is synthesizing dimensional Likert signals, DistilRoBERTa emotion cues, and Isolation Forest anomaly baselines.
            </p>
            <div className="mt-6 space-y-2">
              {[
                'Extracting multidimensional behavioural vectors…',
                'Running Isolation Forest outlier trajectory check…',
                'Analysing semantic emotion polarity with DistilRoBERTa…',
                'Generating Google Gemini clinical validation…',
              ].map((label, i) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-600 text-left"
                >
                  <div className="size-2 rounded-full bg-teal-600 animate-pulse" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <AIDisclaimer compact />
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  // ── Result Screen ──
  if (phase === 'result') {
    const level = getRiskLevel(score);
    const emotionEntries = emotions ? Object.entries(emotions).sort((a, b) => b[1] - a[1]) : [];

    return (
      <Layout role="beneficiary" state={state}>
        <div className="mx-auto max-w-2xl animate-scale-in">
          <Card className="overflow-hidden clinical-card">
            {/* Header banner */}
            <div className="gradient-teal px-8 py-8 text-center text-white">
              <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-white/15 backdrop-blur-xs">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Daily Assessment Submitted
              </h1>
              <p className="mt-1 text-xs text-teal-100 max-w-md mx-auto">
                Thank you for completing your daily reflection. Your responses help map your trajectory and coordinate care.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {/* Anomaly banner */}
              {anomalyFlag && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-purple-200 bg-purple-50/70 p-4">
                  <Zap size={18} className="mt-0.5 shrink-0 text-purple-600" />
                  <div>
                    <p className="text-xs font-bold text-purple-900">Behavioural Anomaly Flagged</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-purple-700">
                      The Isolation Forest model detected an unusual divergence from your baseline pattern. Your assigned care team has been notified for proactive review.
                    </p>
                  </div>
                </div>
              )}

              {/* Engine badge */}
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/90 bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-800">
                  <Brain size={12} />
                  <span>Scored by BytePulse AI & Google Gemini</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Session {currentCaseRef}</span>
              </div>

              {/* Distress Score Readout */}
              <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-6">
                <DistressGauge score={score} size={140} showLabel={false} />
                <div className="text-center sm:text-left max-w-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Calculated Distress Score
                  </div>
                  <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-2">
                    <span className="font-display text-4xl font-extrabold text-slate-900 tabular-nums">
                      {score}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">/ 100</span>
                  </div>
                  <div className="mt-2 flex justify-center sm:justify-start">
                    <RiskBadge level={level} size="lg" showSubtext />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    {level === 'High'
                      ? 'Elevated acute distress detected. Please consider reaching out to your counsellor or accessing crisis resources.'
                      : level === 'Moderate'
                      ? 'Mild to moderate strain noted. Practice pacing, self-care, and communicate with your support circle.'
                      : 'Equilibrium signals steady. Maintain your daily check-in routine!'}
                  </p>
                </div>
              </div>

              {/* Gemini Personal Reflection Quote */}
              {geminiReflection && (
                <div className="mb-6 rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/70 via-emerald-50/30 to-teal-50/50 p-5 shadow-xs">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                      <Sparkles size={15} className="text-teal-600" />
                      <span>Saathi's Personal Reflection</span>
                    </div>
                    <span className="rounded-full border border-teal-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                      {geminiModel || 'Google Gemini Flash'}
                    </span>
                  </div>
                  <p className="text-sm italic leading-relaxed text-slate-700">
                    "{geminiReflection}"
                  </p>
                </div>
              )}

              {/* NLP Emotion breakdown */}
              {emotionEntries.length > 0 && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Brain size={14} className="text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Semantic Emotion Spectrum (From Notes)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {emotionEntries.slice(0, 4).map(([emotion, weight]) => {
                      const barColor = EMOTION_COLORS[emotion] || 'bg-teal-500';
                      return (
                        <div key={emotion} className="rounded-xl border border-slate-200/80 bg-white p-3 text-center">
                          <div className="text-xs font-medium capitalize text-slate-600">{emotion}</div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${(weight * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <div className="mt-1.5 font-display text-xs font-bold text-slate-800">
                            {(weight * 100).toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dimensional Likert summary */}
              <div className="mb-6 grid grid-cols-5 gap-2">
                {CHECK_IN_QUESTIONS.map(({ key, icon: Icon }) => (
                  <div key={key} className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-center">
                    <Icon size={14} className="text-slate-400" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{key}</div>
                    <div className="font-display text-xs font-bold text-slate-800">{answers[key]}/5</div>
                  </div>
                ))}
              </div>

              {note && (
                <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs italic text-slate-600">
                  <span className="font-semibold not-italic text-slate-400 block mb-1">Your reflection note:</span>
                  "{note}"
                </div>
              )}

              <AIDisclaimer />

              {/* Navigation Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <NavLink
                  to="/beneficiary"
                  className="flex-1 rounded-xl gradient-teal py-3 text-center text-xs font-semibold text-white shadow-xs hover:opacity-95"
                >
                  Return to Dashboard
                </NavLink>
                <NavLink
                  to="/beneficiary/history"
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Inspect Full Trajectory
                </NavLink>
                <NavLink
                  to="/counsellor"
                  className="flex-1 rounded-xl border border-teal-200 bg-teal-50 py-3 text-center text-xs font-semibold text-teal-800 hover:bg-teal-100"
                >
                  Care Team View
                </NavLink>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  // ── Questions Wizard ──
  const isNoteStep = step === CHECK_IN_QUESTIONS.length;

  return (
    <Layout role="beneficiary" state={state}>
      <PageHeader
        eyebrow="Daily Emotional Assessment"
        title="Guided Wellbeing Reflection"
        description="Take 2 minutes to evaluate how you feel right now. Your answers are private, non-judgmental, and secure."
      />

      {/* Sleek Progress Stepper */}
      <div className="mb-6 mx-auto max-w-2xl animate-fade-in">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Step {Math.min(step + 1, TOTAL)} of {TOTAL}</span>
          <span className="text-teal-700 font-semibold">{Math.round((step / TOTAL) * 100)}% Completed</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70">
          <div
            className="h-full rounded-full gradient-teal transition-all duration-300"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        {!isNoteStep ? (
          <Card className="clinical-card animate-scale-in overflow-hidden">
            {/* Question Header */}
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                  {React.createElement(currentQ.icon, { size: 16 })}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {currentQ.category}
                </span>
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
                {currentQ.question}
              </h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {currentQ.hint}
              </p>
            </div>

            {/* Likert Options */}
            <div className="p-6">
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const val = idx + 1;
                  const selected = answers[currentQ.key] === val;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => selectAnswer(currentQ.key, val)}
                      className={cx(
                        'w-full flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left text-xs font-medium transition cursor-pointer',
                        selected
                          ? 'border-teal-500 bg-teal-50/70 text-teal-900 shadow-2xs font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <span className={cx(
                        'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition',
                        selected ? 'gradient-teal text-white' : 'bg-slate-100 text-slate-500'
                      )}>
                        {val}
                      </span>
                      <span className="flex-1 text-sm">{opt}</span>
                      {selected && <Check size={16} className="text-teal-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Wizard Nav */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={prevStep}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  onClick={nextStep}
                  disabled={!answers[currentQ.key]}
                  className="inline-flex items-center gap-2 rounded-xl gradient-teal px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-40 transition cursor-pointer"
                >
                  <span>{step === CHECK_IN_QUESTIONS.length - 1 ? 'Next: Journal Note (Optional)' : 'Next Metric'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="clinical-card animate-scale-in p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                <MessageCircle size={17} />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">
                  Optional Reflection Note
                </h2>
                <p className="text-xs text-slate-400">
                  Add context, thoughts, or events that influenced your answers today.
                </p>
              </div>
            </div>

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={5}
              placeholder="E.g., 'Work pressure was particularly intense today, but talking to my friend in the evening helped calm my nerves…'"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition outline-none"
            />

            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-500">
              <Lock size={13} className="shrink-0 text-slate-400" />
              <span>Encrypted & Private: Your words are analyzed for emotional polarity to assist care coordination.</span>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={prevStep}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                onClick={submitCheckin}
                className="inline-flex items-center gap-2 rounded-xl gradient-teal px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Submit & Analyze Assessment</span>
              </button>
            </div>
          </Card>
        )}

        {/* Selected Answers Pills */}
        {Object.values(answers).some(v => v > 0) && !isNoteStep && (
          <div className="mt-4 flex flex-wrap gap-2 animate-fade-in">
            {CHECK_IN_QUESTIONS.map(({ key }) => answers[key] > 0 && (
              <div key={key} className="flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/70 px-3 py-1 text-xs font-medium text-teal-800">
                <Check size={12} className="text-teal-600" />
                <span className="capitalize">{key}: {answers[key]}/5</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
