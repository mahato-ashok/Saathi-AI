import { NavLink } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ReferenceLine,
} from 'recharts';
import {
  Activity, AlertCircle, ArrowRight, BarChart3, CalendarDays,
  CheckCircle2, ChevronRight, HeartHandshake, MessageCircle, TrendingUp, Zap,
  Sparkles, ShieldCheck, Clock
} from 'lucide-react';
import { getRiskLevel, cx } from '../../utils/helpers';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import DistressGauge from '../../components/ui/DistressGauge';
import RiskBadge from '../../components/ui/RiskBadge';
import AIDisclaimer from '../../components/ui/AIDisclaimer';
import SaathiChatbot from '../../components/ui/SaathiChatbot';
import { useAuth } from '../../context/AuthContext';

function QuickActionCard({ icon: Icon, title, text, to, badge }) {
  return (
    <NavLink to={to} className="group block h-full">
      <Card hover className="h-full p-5 flex flex-col justify-between clinical-card-hover">
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div className="grid size-10 place-items-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700 transition group-hover:bg-teal-600 group-hover:text-white">
              <Icon size={18} />
            </div>
            {badge && (
              <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                {badge}
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-teal-800 transition">
            {title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {text}
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:text-teal-800">
          <span>Open view</span>
          <ChevronRight size={13} className="transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </NavLink>
  );
}

/** Returns today as YYYY-MM-DD */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Custom clinical tooltip for Recharts
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const level = getRiskLevel(score);
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/5 text-xs font-body">
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

export default function BeneficiaryDashboard({ state, setState }) {
  const { user } = useAuth();
  const currentName = user?.full_name || state?.profile?.name || 'Beneficiary';
  const firstName = currentName.split(' ')[0];
  const userStreak = user?.streak ?? state?.profile?.streak ?? 0;
  const userJoinDate = user?.join_date || state?.profile?.joinDate || 'Sep 2026';
  const alreadyCheckedIn = (user?.last_checkin_date || state?.profile?.lastCheckinDate) === todayStr();

  const hasCheckins = state?.checkins && state.checkins.length > 0;
  const latest = hasCheckins
    ? state.checkins[0]
    : {
        score: user?.checkin_base_score ?? state?.profile?.checkinBaseScore ?? 0,
        level: getRiskLevel(user?.checkin_base_score ?? state?.profile?.checkinBaseScore ?? 0),
        mood: 3,
        safety: 3,
        sleep: 3,
        anxiety: 2,
        support: 3,
        fullDate: 'Initial assessment pending',
        submittedAt: '—',
        note: '',
      };

  const avg = hasCheckins
    ? Math.round(state.checkins.reduce((s, x) => s + x.score, 0) / state.checkins.length)
    : latest.score;
  const chartData = hasCheckins
    ? [...state.checkins].reverse().map(x => ({ day: x.date, score: x.score }))
    : [{ day: 'Baseline', score: latest.score }];
  const level = getRiskLevel(latest.score);

  const levelConfig = {
    Low: {
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-800',
      border: 'border-emerald-200/90',
      icon: CheckCircle2,
      msg: 'Your wellbeing signals indicate steady emotional equilibrium.',
    },
    Moderate: {
      bg: 'bg-amber-50/70',
      text: 'text-amber-800',
      border: 'border-amber-200/90',
      icon: Activity,
      msg: 'Elevated strain detected. Take mindful pauses and connect with your support network.',
    },
    High: {
      bg: 'bg-rose-50/70',
      text: 'text-rose-800',
      border: 'border-rose-200/90',
      icon: AlertCircle,
      msg: 'Significant acute distress signal detected. Please connect with your assigned counsellor.',
    },
  };
  const lc = levelConfig[level] || levelConfig.Low;
  const LevelIcon = lc.icon;
  const statusMsg = hasCheckins ? lc.msg : 'Welcome to your private wellbeing space. Begin your daily assessment below to establish your emotional baseline.';

  return (
    <Layout role="beneficiary" state={state}>
      {/* Page Header */}
      <PageHeader
        eyebrow="Beneficiary Wellness Portal"
        title={`Welcome back, ${firstName}`}
        description="Your dedicated space for daily emotional reflection, pattern tracking, and coordinated support."
        action={
          alreadyCheckedIn ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-2xs">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Assessment Completed Today</span>
            </div>
          ) : (
            <NavLink
              to="/beneficiary/checkin"
              className="inline-flex items-center gap-2 rounded-xl gradient-teal px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition"
            >
              <span>Begin Today’s Assessment</span>
              <ArrowRight size={15} />
            </NavLink>
          )
        }
      />

      {/* Hero Wellbeing Status Banner */}
      <Card className={cx('mb-6 border p-5 sm:p-6 clinical-card', lc.border, lc.bg)}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start sm:items-center gap-4">
            <div className={cx('grid size-12 shrink-0 place-items-center rounded-2xl bg-white shadow-xs border', lc.border, lc.text)}>
              <LevelIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cx('font-display text-base font-bold tracking-tight', lc.text)}>
                  {statusMsg}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} className="text-slate-400" />
                  {hasCheckins
                    ? `Last submitted ${latest.fullDate} at ${latest.submittedAt}`
                    : 'No check-ins submitted yet'}
                </span>
                <span>•</span>
                <span className="font-medium text-slate-700">Streak: {userStreak} days active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 border-t lg:border-t-0 lg:border-l border-slate-200/80 pt-4 lg:pt-0 lg:pl-6 shrink-0 justify-between sm:justify-start">
            <DistressGauge score={latest.score} size={84} showLabel={false} />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Status</div>
              <div className="mt-1">
                <RiskBadge level={level} size="lg" showSubtext />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics Row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Consistent Habit"
          value={`${userStreak} Days`}
          icon={Zap}
          variant="success"
          trendLabel="Active streak"
          subtext="Consecutive daily reflections"
        />
        <StatCard
          label="Total Reflections"
          value={hasCheckins ? state.checkins.length : 0}
          icon={CalendarDays}
          variant="default"
          subtext={`Recorded since ${userJoinDate}`}
        />
        <StatCard
          label="30-Day Moving Average"
          value={avg}
          icon={BarChart3}
          trend={latest.score > avg ? 1 : latest.score < avg ? -1 : 0}
          trendLabel={latest.score > avg ? `+${latest.score - avg} from avg` : `${latest.score - avg} from avg`}
          variant={latest.score > avg ? 'warning' : 'success'}
          subtext="Composite distress index"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
        {/* Distress Trajectory Chart */}
        <Card className="p-5 sm:p-6 clinical-card animate-slide-up">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">
                Distress Trajectory Over Time
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Composite 0–100 index (lower score reflects emotional balance)
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              <TrendingUp size={13} className="text-teal-600" />
              <span>{chartData.length} Data Points</span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="beneficiaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
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
                  fill="url(#beneficiaryAreaGrad)"
                  dot={{ fill: '#0f766e', strokeWidth: 2, stroke: '#ffffff', r: 4 }}
                  activeDot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Multidimensional Radar Breakdown */}
        <Card className="p-5 sm:p-6 clinical-card animate-slide-up">
          <div className="mb-4">
            <h2 className="font-display font-bold text-base text-slate-900">
              Dimensional Signal Breakdown
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Normalized score per wellbeing pillar (0–100)
            </p>
          </div>

          <div className="h-54">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { subject: 'Mood', val: (latest.mood || 3) * 20 },
                { subject: 'Safety', val: (latest.safety || 3) * 20 },
                { subject: 'Sleep', val: (latest.sleep || 3) * 20 },
                { subject: 'Support', val: (latest.support || 3) * 20 },
                { subject: 'Calm', val: (6 - (latest.anxiety || 2)) * 20 },
              ]}>
                <PolarGrid stroke="#e2e8f0" strokeDasharray="2 2" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                <Radar dataKey="val" stroke="#0d9488" fill="#14b8a6" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Score']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
            Higher values indicate positive emotional equilibrium
          </p>
        </Card>
      </div>

      {/* Quick Actions Panel */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {alreadyCheckedIn ? (
          <NavLink to="/beneficiary/checkin" className="group block h-full">
            <Card hover className="h-full p-5 border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
              <div>
                <div className="mb-3.5 grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">Assessment Complete ✓</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  You completed today's reflection. Review results or view your trend summary anytime.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <span>View submission</span>
                <ChevronRight size={13} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </NavLink>
        ) : (
          <QuickActionCard
            icon={CalendarDays}
            title="Daily Assessment"
            text="2–3 minute guided check-in covering mood, sleep, anxiety, and support."
            to="/beneficiary/checkin"
            badge="Recommended"
          />
        )}

        <QuickActionCard
          icon={TrendingUp}
          title="Trajectory & Log"
          text="Inspect long-term longitudinal patterns and review previous reflection entries."
          to="/beneficiary/history"
        />

        <QuickActionCard
          icon={HeartHandshake}
          title="Crisis Support"
          text="24/7 verified crisis helplines, clinical grounding exercises, and emergency protocol."
          to="/beneficiary/help"
        />

        {/* Saathi Companion trigger card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            const btn = document.getElementById('saathi-chat-fab');
            if (btn) btn.click();
          }}
          className="group block h-full text-left cursor-pointer"
        >
          <Card hover className="h-full p-5 flex flex-col justify-between clinical-card-hover border-teal-100 bg-teal-50/40">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow-xs">
                  <MessageCircle size={18} />
                </div>
                <span className="rounded-full border border-teal-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                  AI Companion
                </span>
              </div>
              <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-teal-800 transition">
                Speak with Saathi
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Private conversational listener powered by Gemini Flash with real-time sentiment support.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-teal-100/60 flex items-center gap-1 text-xs font-semibold text-teal-800">
              <span>Open companion</span>
              <ChevronRight size={13} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Card>
        </div>
      </div>

      {/* Clinical Disclaimer */}
      <div className="mt-6">
        <AIDisclaimer />
      </div>

      {/* Saathi Floating Chatbot */}
      <SaathiChatbot state={state} setState={setState} />
    </Layout>
  );
}
