import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  ArrowLeft, Brain, Check, Clock3, Heart, Moon, Plus, Sun, Wind,
  Sparkles, Loader2, Copy, FileText, Activity, ShieldAlert
} from 'lucide-react';
import { fetchCounsellorSummary, createCounsellorIntervention } from '../../utils/api';
import { cx, getRiskLevel } from '../../utils/helpers';
import { saveState } from '../../data/seedData';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import RiskBadge from '../../components/ui/RiskBadge';
import TrendChip from '../../components/ui/TrendChip';
import DistressGauge from '../../components/ui/DistressGauge';
import AIDisclaimer from '../../components/ui/AIDisclaimer';

function CaseTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const level = getRiskLevel(score);
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs font-body">
        <div className="text-[11px] font-semibold text-slate-400 mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-bold text-slate-900">{score}</span>
          <span className="text-slate-400">/ 100</span>
          <RiskBadge level={level} size="sm" />
        </div>
      </div>
    );
  }
  return null;
}

export default function CaseDetail({ state, setState }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = state.cases.find(x => x.id === id) || state.cases[0];
  const [actionType, setActionType] = useState('Check-in call');
  const [actionNote, setActionNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  async function handleGenerateSummary() {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const res = await fetchCounsellorSummary(c);
      setAiSummary(res);
    } catch (err) {
      console.error(err);
      setSummaryError('Unable to generate AI brief. Ensure BytePulse AI engine is running on port 8000.');
    } finally {
      setLoadingSummary(false);
    }
  }

  function addIntervention() {
    if (!actionNote.trim()) return;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const newIntervention = {
      id: `iv-${Date.now()}`,
      date: today,
      type: actionType,
      note: actionNote,
      counsellor: 'Dr. Kavya',
    };
    const updatedCase = {
      ...c,
      interventions: [newIntervention, ...c.interventions],
      status: 'In follow-up',
    };
    const next = { ...state, cases: state.cases.map(x => x.id === c.id ? updatedCase : x) };
    setState(next);
    saveState(next);

    // Sync intervention to PostgreSQL
    createCounsellorIntervention(c.id, {
      type: actionType,
      note: actionNote,
      counsellor: 'Dr. Kavya',
    }).catch(err => console.warn('PostgreSQL intervention sync skipped or offline:', err.message));

    setActionNote('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const aiIndicators = [
    { label: 'Mood signal', value: c.indicators?.mood || 'Fair', icon: Sun },
    { label: 'Sleep signal', value: c.indicators?.sleep || 'Mixed', icon: Moon },
    { label: 'Anxiety signal', value: c.indicators?.anxiety || 'Moderate', icon: Wind },
    { label: 'Support signal', value: c.indicators?.support || 'Limited', icon: Heart },
  ];

  const indicatorColors = {
    'Very Low': 'text-rose-700 bg-rose-50 border-rose-200',
    'Low': 'text-amber-700 bg-amber-50 border-amber-200',
    'Very Poor': 'text-rose-700 bg-rose-50 border-rose-200',
    'Poor': 'text-amber-700 bg-amber-50 border-amber-200',
    'High': 'text-rose-700 bg-rose-50 border-rose-200',
    'Elevated': 'text-amber-700 bg-amber-50 border-amber-200',
    'Absent': 'text-rose-700 bg-rose-50 border-rose-200',
    'Limited': 'text-amber-700 bg-amber-50 border-amber-200',
    'Moderate': 'text-amber-700 bg-amber-50 border-amber-200',
    'Fair': 'text-slate-700 bg-slate-100 border-slate-200',
    'Good': 'text-emerald-700 bg-emerald-50 border-emerald-200',
    'Strong': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  };

  return (
    <Layout role="counsellor" state={state}>
      {/* Back button and patient profile header */}
      <div className="mb-6 animate-fade-in">
        <button
          onClick={() => navigate('/counsellor/cases')}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-800 transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to active caseload</span>
        </button>

        <PageHeader
          eyebrow={`Electronic Care Record · ${c.id}`}
          title={c.name}
          description={`${c.age} years old · ${c.area} District · Monitored under Problem Statement 26094 · Last updated ${c.updated}`}
          action={
            <div className="flex items-center gap-3">
              <RiskBadge level={c.risk} size="lg" showSubtext />
              <div className="flex items-baseline gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
                <span className="font-display text-2xl font-extrabold text-slate-900 tabular-nums">
                  {c.score}
                </span>
                <span className="text-xs font-medium text-slate-400">/ 100</span>
              </div>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Distress Trajectory Chart */}
          <Card className="p-5 sm:p-6 clinical-card animate-slide-up">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">
                  Longitudinal Distress Trajectory
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Automated multimodal score tracking with trend velocity
                </p>
              </div>
              <TrendChip trend={c.trend} />
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Current Score', value: `${c.score} / 100` },
                { label: 'Trajectory Direction', value: c.trend === 'rising' ? '↗ Accelerating' : c.trend === 'falling' ? '↘ De-escalating' : '→ Steady Baseline' },
                { label: 'Open Alerts', value: `${c.alerts || 0} Incident flags` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
                  <div className="mt-1 font-display font-bold text-xs text-slate-800">{value}</div>
                </div>
              ))}
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={c.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="caseDetailGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CaseTooltip />} />
                  <ReferenceLine
                    y={75}
                    stroke="#fda4af"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: 'High Risk (75)', position: 'insideTopRight', fontSize: 10, fill: '#e11d48' }}
                  />
                  <ReferenceLine
                    y={50}
                    stroke="#fde68a"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: 'Moderate (50)', position: 'insideTopRight', fontSize: 10, fill: '#d97706' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fill="url(#caseDetailGrad)"
                    dot={{ fill: '#0f766e', strokeWidth: 2, stroke: '#ffffff', r: 4 }}
                    activeDot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Beneficiary Context Note */}
          <Card className="p-5 sm:p-6 clinical-card animate-slide-up">
            <h2 className="font-display font-bold text-base text-slate-900 mb-2">
              Latest Beneficiary Journal Submission
            </h2>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs italic leading-relaxed text-slate-700">
              "{c.notes || 'No qualitative journal note was submitted for this record.'}"
            </div>
          </Card>

          {/* Gemini AI Clinical Synthesis Card */}
          <Card className="p-5 sm:p-6 clinical-card animate-slide-up border-teal-200/90">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
                  <Sparkles size={17} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-slate-900">
                    AI Clinical Synthesis
                  </h2>
                  <p className="text-xs text-slate-400">
                    Synthesized by Google Gemini Flash Clinical Decision Support
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="inline-flex items-center gap-2 rounded-xl gradient-teal px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50 transition cursor-pointer"
              >
                {loadingSummary ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Synthesizing with Gemini…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>{aiSummary ? 'Regenerate Brief' : 'Generate Gemini Brief'}</span>
                  </>
                )}
              </button>
            </div>

            {summaryError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {summaryError}
              </div>
            )}

            {aiSummary ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[11px] text-slate-400 font-medium">
                  <span>Engine: {aiSummary.provider || 'Google Gemini'} ({aiSummary.model_used || 'gemini-2.5-flash'})</span>
                  <button
                    onClick={() => {
                      setActionNote(prev => (prev ? `${prev}\n\n` : '') + `AI Clinical Synthesis:\n${aiSummary.summary}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800 transition cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>{copied ? 'Inserted into Notes!' : 'Insert into Action Notes'}</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs font-mono leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {aiSummary.summary}
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  {aiSummary.disclaimer || 'CDS Advisory: Synthesized for clinical review only. Human evaluation mandatory.'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <Sparkles size={20} className="mx-auto text-teal-600 mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-700">No Gemini Clinical Brief Generated</p>
                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                  Click "Generate Gemini Brief" to aggregate trajectory vectors, note polarity, and suggested actions.
                </p>
              </div>
            )}
          </Card>

          {/* Intervention Timeline */}
          <Card className="p-5 sm:p-6 clinical-card animate-slide-up">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">
                  Intervention Timeline
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Documented clinical actions and survivor outreach history
                </p>
              </div>
              <div className="grid size-8 place-items-center rounded-xl bg-slate-100 text-slate-500">
                <Clock3 size={15} />
              </div>
            </div>

            <div className="space-y-4">
              {c.interventions.length > 0 ? (
                c.interventions.map((iv, i) => (
                  <div key={iv.id || i} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <div className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                        <Check size={13} />
                      </div>
                      {i < c.interventions.length - 1 && (
                        <div className="mt-1 w-0.5 flex-1 bg-slate-100" />
                      )}
                    </div>
                    <div className="mb-3 flex-1 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-900">{iv.type}</span>
                        <span className="text-[10px] font-mono text-slate-400">{iv.date}</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        {iv.note}
                      </p>
                      <div className="mt-2 text-[10px] font-semibold text-teal-800">
                        Documented by {iv.counsellor}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  No previous clinical interventions recorded for this case.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Indicators Card */}
          <Card className="p-5 sm:p-6 clinical-card animate-slide-up">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                <Brain size={16} />
              </div>
              <h2 className="font-display font-bold text-base text-slate-900">
                Dimensional Signals
              </h2>
            </div>

            <div className="space-y-2.5">
              {aiIndicators.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                    <Icon size={14} className="text-slate-400" />
                    <span>{label}</span>
                  </div>
                  <span className={cx(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-bold border',
                    indicatorColors[value] || 'text-slate-700 bg-slate-100 border-slate-200'
                  )}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
              Indicators derived from synthetic assessment telemetry. Always confirm with the beneficiary during clinical check-in sessions.
            </p>
          </Card>

          {/* Record Intervention Form Card */}
          <Card className="p-5 sm:p-6 clinical-card animate-slide-up">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                <Plus size={16} />
              </div>
              <h2 className="font-display font-bold text-base text-slate-900">
                Record Clinical Action
              </h2>
            </div>
            <p className="mb-4 text-xs text-slate-400 leading-relaxed">
              Document a human-led care coordination step. Persists to PostgreSQL 18.
            </p>

            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Action Category</label>
            <select
              value={actionType}
              onChange={e => setActionType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            >
              <option>Check-in call</option>
              <option>Counselling session</option>
              <option>Safety plan review</option>
              <option>Specialist referral</option>
              <option>Follow-up message</option>
              <option>Emergency escalation</option>
            </select>

            <label className="mt-4 block text-xs font-semibold text-slate-700 mb-1.5">Clinical Notes & Action Plan</label>
            <textarea
              value={actionNote}
              onChange={e => setActionNote(e.target.value)}
              rows={5}
              placeholder="What was discussed, agreed upon, or escalated with the beneficiary?"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition outline-none"
            />

            <button
              onClick={addIntervention}
              disabled={!actionNote.trim()}
              className={cx(
                'mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer',
                actionNote.trim()
                  ? 'gradient-teal text-white shadow-xs hover:opacity-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              )}
            >
              {saved ? (
                <>
                  <Check size={14} />
                  <span>Intervention Saved!</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Save Clinical Intervention</span>
                </>
              )}
            </button>
          </Card>

          {/* Distress Dial Card */}
          <Card className="p-5 sm:p-6 clinical-card animate-slide-up text-center">
            <h2 className="font-display font-bold text-base text-slate-900 mb-4">
              Current Distress Index
            </h2>
            <div className="flex flex-col items-center">
              <DistressGauge score={c.score} size={150} showLabel={false} />
              <div className="mt-3">
                <RiskBadge level={c.risk} size="lg" showSubtext />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
