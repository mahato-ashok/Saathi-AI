import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight, Filter, Search, Users, Sparkles } from 'lucide-react';
import { cx } from '../../utils/helpers';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import RiskBadge from '../../components/ui/RiskBadge';
import TrendChip from '../../components/ui/TrendChip';
import AIDisclaimer from '../../components/ui/AIDisclaimer';

export default function CasesList({ state }) {
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');

  const filtered = state.cases.filter(c => {
    const matchSearch = (c.name + c.id + c.status + c.area).toLowerCase().includes(search.toLowerCase());
    const matchRisk = filterRisk === 'All' || c.risk === filterRisk;
    return matchSearch && matchRisk;
  });

  return (
    <Layout role="counsellor" state={state}>
      <PageHeader
        eyebrow="Cohort Management"
        title="Active Caseload Registry"
        description="Comprehensive monitoring registry across assigned program areas. Review individual trajectory records, anomaly flags, and document interventions."
      />

      <Card className="overflow-hidden clinical-card animate-slide-up">
        {/* Filters Header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/40">
          <div className="relative flex-1 sm:max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name, case reference, district, or status…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9.5 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
              <Filter size={13} className="text-slate-400" />
              <span>Risk Tier:</span>
            </div>
            {['All', 'High', 'Moderate', 'Low'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                className={cx(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer border',
                  filterRisk === r
                    ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {r}
              </button>
            ))}
            <span className="ml-2 text-xs font-medium text-slate-400">
              {filtered.length} matching {filtered.length === 1 ? 'case' : 'cases'}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[840px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Beneficiary / Profile</th>
                <th className="px-6 py-3.5">Distress Index</th>
                <th className="px-6 py-3.5">Trajectory</th>
                <th className="px-6 py-3.5">Clinical Status</th>
                <th className="px-6 py-3.5">Interventions</th>
                <th className="px-6 py-3.5">Last Logged</th>
                <th className="px-4 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition group">
                  <td className="px-6 py-4">
                    <NavLink to={`/counsellor/cases/${c.id}`} className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 border border-teal-100 font-display font-bold text-xs text-teal-800">
                        {c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900 group-hover:text-teal-800 transition">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {c.id} · {c.age} yrs · {c.area}
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
                      c.status === 'Stable' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
                      'border-slate-200 bg-slate-50 text-slate-700'
                    )}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 text-slate-600 font-medium">
                    {c.interventions.length} documented
                  </td>
                  <td className="px-6 text-slate-500 font-medium">
                    {c.updated}
                  </td>
                  <td className="px-4 text-right">
                    <NavLink
                      to={`/counsellor/cases/${c.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 shadow-2xs transition"
                    >
                      <span>Record</span>
                      <ChevronRight size={13} />
                    </NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={20} />
              </div>
              <h3 className="font-display font-bold text-sm text-slate-700">No matching cases found</h3>
              <p className="mt-1 text-xs text-slate-400">Try adjusting your search query or risk filter.</p>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6">
        <AIDisclaimer />
      </div>
    </Layout>
  );
}
