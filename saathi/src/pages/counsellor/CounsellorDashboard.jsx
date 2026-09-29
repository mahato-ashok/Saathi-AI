import { NavLink } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  AlertTriangle, Bell, BellRing, ChevronRight,
  ClipboardList, Clock3, Users, ArrowUpRight, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { cx } from '../../utils/helpers';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import RiskBadge from '../../components/ui/RiskBadge';
import TrendChip from '../../components/ui/TrendChip';
import AIDisclaimer from '../../components/ui/AIDisclaimer';

function PriorityTable({ cases }) {
  return (
    <Card className="overflow-hidden clinical-card animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base text-slate-900">
              Priority Clinical Caseload
            </h2>
            <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              {cases.length} Flags
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Beneficiaries exhibiting elevated or accelerating distress trajectories requiring review
          </p>
        </div>
        <NavLink
          to="/counsellor/cases"
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
        >
          <span>View entire caseload</span>
          <ChevronRight size={13} />
        </NavLink>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Beneficiary / ID</th>
              <th className="px-6 py-3.5">Distress Index</th>
              <th className="px-6 py-3.5">Trajectory</th>
              <th className="px-6 py-3.5">Triage Status</th>
              <th className="px-6 py-3.5">Pending Alerts</th>
              <th className="px-6 py-3.5">Last Update</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map(c => (
              <tr key={c.id} className="group hover:bg-slate-50/70 transition">
                <td className="px-6 py-4">
                  <NavLink to={`/counsellor/cases/${c.id}`} className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 border border-teal-100 font-display font-bold text-xs text-teal-800">
                      {c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-teal-800 transition text-sm">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {c.id} · {c.area}
                      </div>
                    </div>
                  </NavLink>
                </td>
                <td className="px-6">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-extrabold text-base text-slate-900 tabular-nums">
                      {c.score}
                    </span>
                    <RiskBadge level={c.risk} size="sm" />
                  </div>
                </td>
                <td className="px-6">
                  <TrendChip trend={c.trend} />
                </td>
                <td className="px-6">
                  <span className={cx(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-semibold border',
                    c.status === 'Escalated' ? 'border-rose-200 bg-rose-50 text-rose-800' :
                    c.status === 'Needs review' ? 'border-amber-200 bg-amber-50 text-amber-800' :
                    'border-slate-200 bg-slate-50 text-slate-700'
                  )}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6">
                  {c.alerts > 0 ? (
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                      {c.alerts}
                    </span>
                  ) : (
                    <span className="text-slate-300 font-mono">—</span>
                  )}
                </td>
                <td className="px-6 text-slate-500 text-xs font-medium">
                  {c.updated}
                </td>
                <td className="px-4 text-right">
                  <NavLink
                    to={`/counsellor/cases/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 shadow-2xs transition"
                  >
                    <span>Inspect</span>
                    <ChevronRight size={13} />
                  </NavLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function CounsellorDashboard({ state }) {
  const { cases, weeklyStats, alerts } = state;
  const highRisk = cases.filter(c => c.risk === 'High').length;
  const needsReview = cases.filter(c => c.status === 'Needs review' || c.status === 'Escalated').length;
  const unread = alerts.filter(a => !a.read).length;

  return (
    <Layout role="counsellor" state={state}>
      <PageHeader
        eyebrow="Clinical Triage Center"
        title="Good morning, Dr. Kavya"
        description="Real-time multi-modal distress monitoring, automated behavioural anomaly detection, and coordinated intervention tracking."
        action={
          <div className="flex items-center gap-2.5">
            <NavLink
              to="/counsellor/alerts"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <Bell size={14} className="text-slate-500" />
              <span>Priority Alerts</span>
              {unread > 0 && (
                <span className="grid size-4.5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/counsellor/cases"
              className="inline-flex items-center gap-2 rounded-xl gradient-teal px-4.5 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition"
            >
              <ClipboardList size={14} />
              <span>Full Caseload ({cases.length})</span>
            </NavLink>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Monitored Beneficiaries"
          value={cases.length}
          icon={Users}
          variant="default"
          subtext="Active assigned cases"
        />
        <StatCard
          label="Requires Immediate Review"
          value={needsReview}
          icon={Clock3}
          variant="warning"
          trend={1}
          trendLabel="Urgent attention"
          subtext="Escalated or pending triage"
        />
        <StatCard
          label="High Risk Thresholds"
          value={highRisk}
          icon={AlertTriangle}
          variant="danger"
          trend={1}
          trendLabel="Critical alerts"
          subtext="Distress score ≥ 75"
        />
        <StatCard
          label="Unreviewed Incident Alerts"
          value={unread}
          icon={Bell}
          variant={unread > 0 ? 'warning' : 'success'}
          subtext={unread > 0 ? 'Action required in queue' : 'All clear across cohort'}
        />
      </div>

      {/* Main Grid: Caseload distribution + Recent alerts */}
      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
        {/* Weekly Caseload Distribution Chart */}
        <Card className="p-5 sm:p-6 clinical-card animate-slide-up">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">
                Cohort Distress Distribution
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Weekly longitudinal volume stratified by clinical risk tier
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="size-2.5 rounded-full bg-rose-400" />
                <span>High</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats} barGap={4} barSize={20} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                />
                <Bar dataKey="low" stackId="a" fill="#34d399" name="Low Risk" radius={[0, 0, 0, 0]} />
                <Bar dataKey="moderate" stackId="a" fill="#fbbf24" name="Moderate Risk" radius={[0, 0, 0, 0]} />
                <Bar dataKey="high" stackId="a" fill="#f87171" name="High Risk" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Incident Alerts Panel */}
        <Card className="p-5 sm:p-6 clinical-card animate-slide-up flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-slate-900">
                  Priority Alerts Feed
                </h2>
                {unread > 0 && (
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <NavLink
                to="/counsellor/alerts"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
              >
                View all queue →
              </NavLink>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 4).map(alert => (
                <NavLink
                  key={alert.id}
                  to={`/counsellor/cases/${alert.caseId}`}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:border-teal-200 hover:bg-teal-50/30 transition group block"
                >
                  <div className={cx(
                    'mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border',
                    alert.severity === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    alert.severity === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                  )}>
                    <BellRing size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-slate-900 group-hover:text-teal-800 truncate">
                        {alert.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {alert.time}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-teal-700 font-semibold">
                      <span>Case {alert.caseId}</span>
                      <span>•</span>
                      <span>Review Record →</span>
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Priority Cases Table */}
      <div className="mt-6">
        <PriorityTable cases={cases.filter(c => c.risk !== 'Low')} />
      </div>

      <div className="mt-6">
        <AIDisclaimer />
      </div>
    </Layout>
  );
}
