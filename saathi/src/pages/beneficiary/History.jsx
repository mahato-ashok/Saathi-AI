import { NavLink } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts';
import { ArrowRight, Calendar, TrendingDown, TrendingUp, History as HistoryIcon, FileText } from 'lucide-react';
import { getRiskLevel, cx } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import RiskBadge from '../../components/ui/RiskBadge';
import AIDisclaimer from '../../components/ui/AIDisclaimer';

function CustomTooltip({ active, payload, label }) {
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

export default function History({ state }) {
  const { user } = useAuth();
  const userJoinDate = user?.join_date || state?.profile?.joinDate || 'Sep 2026';
  const hasCheckins = state?.checkins && state.checkins.length > 0;
  const chartData = hasCheckins ? [...state.checkins].reverse().map(x => ({ date: x.date, score: x.score })) : [];
  const avg = hasCheckins ? Math.round(state.checkins.reduce((s, x) => s + x.score, 0) / state.checkins.length) : 0;
  const latest = hasCheckins ? state.checkins[0] : { score: 0, level: 'Low' };
  const lowest = hasCheckins ? Math.min(...state.checkins.map(x => x.score)) : 0;
  const highest = hasCheckins ? Math.max(...state.checkins.map(x => x.score)) : 0;

  return (
    <Layout role="beneficiary" state={state}>
      <PageHeader
        eyebrow="Longitudinal Telemetry"
        title="Wellbeing Trajectory & History"
        description="Review your historical check-in assessments. Longitudinal trends reveal patterns that empower your recovery and dialogue with care coordinators."
        action={
          <NavLink
            to="/beneficiary/checkin"
            className="inline-flex items-center gap-2 rounded-xl gradient-teal px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition"
          >
            <span>Start Daily Check-in</span>
            <ArrowRight size={14} />
          </NavLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
        {/* Trend Area Chart */}
        <Card className="p-5 sm:p-6 clinical-card animate-slide-up">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">
                Composite Distress Trajectory
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                All historical assessment data points plotted across time
              </p>
            </div>
            <RiskBadge level={getRiskLevel(latest.score)} size="lg" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
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
                  fill="url(#historyGrad)"
                  dot={{ fill: '#0f766e', strokeWidth: 2, stroke: '#ffffff', r: 4 }}
                  activeDot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Aggregate Metrics Card */}
        <Card className="p-6 clinical-card animate-slide-up flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 mb-4">
              Telemetry Summary
            </h2>
            <div className="space-y-3">
              {[
                { label: '30-Day Moving Average', value: avg, sub: 'Across all recorded sessions' },
                { label: 'Lowest Distress Baseline', value: lowest, sub: 'Peak emotional equilibrium' },
                { label: 'Highest Distress Spike', value: highest, sub: 'Peak strain detected' },
                { label: 'Total Assessments Logged', value: hasCheckins ? state.checkins.length : 0, sub: `Active since ${userJoinDate}` },
              ].map(({ label, value, sub }) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">{label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
                  </div>
                  <div className="font-display text-xl font-bold text-teal-800 tabular-nums">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <NavLink
              to="/beneficiary/checkin"
              className="flex w-full items-center justify-center gap-2 rounded-xl gradient-teal py-3 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition"
            >
              <span>Record New Check-in</span>
              <ArrowRight size={14} />
            </NavLink>
          </div>
        </Card>
      </div>

      {/* Historical Assessment Log Table */}
      <Card className="mt-6 overflow-hidden clinical-card animate-slide-up">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900">
              Longitudinal Assessment Log
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Complete chronological audit trail with dimensional Likert signals
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {hasCheckins ? state.checkins.length : 0} submissions
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {!hasCheckins ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No assessments recorded yet. Submit your first daily assessment to view historical trends here.
            </div>
          ) : (
            state.checkins.map((x, i) => (
            <div key={x.id || i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 hover:bg-slate-50/70 transition">
              <div className="flex items-start sm:items-center gap-4">
                <div className={cx(
                  'grid size-11 shrink-0 place-items-center rounded-xl font-display font-bold text-sm border',
                  x.level === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  x.level === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}>
                  {x.score}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      {x.fullDate || x.date}
                    </span>
                    {x.submittedAt && (
                      <span className="text-xs text-slate-400">at {x.submittedAt}</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      Mood {x.mood}/5
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      Sleep {x.sleep}/5
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      Anxiety {x.anxiety}/5
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      Support {x.support}/5
                    </span>
                  </div>
                  {x.note && (
                    <div className="mt-2 text-xs italic text-slate-500 max-w-xl">
                      "{x.note}"
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <RiskBadge level={x.level} size="sm" />
              </div>
            </div>
          )))}
        </div>
      </Card>

      <div className="mt-6">
        <AIDisclaimer />
      </div>
    </Layout>
  );
}
