import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Info,
  Bell, Check, Filter
} from 'lucide-react';
import { cx } from '../../utils/helpers';
import { saveState } from '../../data/seedData';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import AIDisclaimer from '../../components/ui/AIDisclaimer';

export default function AlertsPage({ state, setState }) {
  const [filter, setFilter] = useState('all');

  function markRead(id) {
    const next = {
      ...state,
      alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a),
    };
    setState(next);
    saveState(next);
  }

  function markAllRead() {
    const next = { ...state, alerts: state.alerts.map(a => ({ ...a, read: true })) };
    setState(next);
    saveState(next);
  }

  const severityConfig = {
    critical: {
      icon: AlertCircle,
      bg: 'border-rose-200/90 bg-rose-50/50',
      iconBg: 'bg-rose-100 text-rose-700 border border-rose-200',
      label: 'Critical Alert',
      labelColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'border-amber-200/90 bg-amber-50/40',
      iconBg: 'bg-amber-100 text-amber-700 border border-amber-200',
      label: 'Warning Signal',
      labelColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    info: {
      icon: Info,
      bg: 'border-slate-200 bg-slate-50/50',
      iconBg: 'bg-slate-100 text-slate-600 border border-slate-200',
      label: 'Notice',
      labelColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  };

  const filteredAlerts = state.alerts.filter(a => {
    if (filter === 'unread') return !a.read;
    if (filter === 'critical') return a.severity === 'critical';
    return true;
  });

  const unreadCount = state.alerts.filter(a => !a.read).length;

  return (
    <Layout role="counsellor" state={state}>
      <PageHeader
        eyebrow="Triage Queue"
        title="Priority Clinical Alerts"
        description="Automated multi-modal distress triggers, behavioural anomaly flags, and rapid score escalations awaiting supervisor review."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            >
              <CheckCircle2 size={14} className="text-teal-600" />
              <span>Mark All Read</span>
            </button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cx(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer border',
            filter === 'all'
              ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          All Alerts ({state.alerts.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cx(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer border',
            filter === 'unread'
              ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          Unreviewed ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={cx(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer border',
            filter === 'critical'
              ? 'border-rose-400 bg-rose-50 text-rose-900 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          Critical Only
        </button>
      </div>

      <div className="space-y-3.5 animate-slide-up">
        {filteredAlerts.map(alert => {
          const cfg = severityConfig[alert.severity] || severityConfig.info;
          const AlertIcon = cfg.icon;
          return (
            <Card
              key={alert.id}
              className={cx('p-5 clinical-card transition border', alert.read ? 'opacity-70 bg-white' : cfg.bg)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cx('grid size-11 shrink-0 place-items-center rounded-2xl', cfg.iconBg)}>
                    <AlertIcon size={20} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-bold text-sm text-slate-900">{alert.name}</span>
                      <span className={cx('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', cfg.labelColor)}>
                        {cfg.label}
                      </span>
                      {!alert.read && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.2 text-[9px] font-extrabold text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-teal-800">{alert.type}</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 max-w-2xl">{alert.message}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>Case {alert.caseId}</span>
                      <span>•</span>
                      <span>Triggered {alert.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  {!alert.read && (
                    <button
                      onClick={() => markRead(alert.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                    >
                      Mark Reviewed
                    </button>
                  )}
                  <NavLink
                    to={`/counsellor/cases/${alert.caseId}`}
                    className="inline-flex items-center gap-1.5 rounded-xl gradient-teal px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition"
                  >
                    <span>Inspect Case</span>
                    <ArrowRight size={13} />
                  </NavLink>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredAlerts.length === 0 && (
          <Card className="p-16 text-center clinical-card">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="font-display font-bold text-base text-slate-800">No Pending Incidents</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              All monitored beneficiaries are currently operating within established safety parameters.
            </p>
          </Card>
        )}

        <div className="mt-6">
          <AIDisclaimer />
        </div>
      </div>
    </Layout>
  );
}
