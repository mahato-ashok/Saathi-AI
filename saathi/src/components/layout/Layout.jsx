import { useState, useEffect } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell, BarChart3, HeartHandshake, HelpCircle, Home,
  LogOut, Menu, ShieldCheck, TrendingUp, Users, ArrowRightLeft,
  Activity, CheckCircle2, ChevronRight, Stethoscope, User
} from 'lucide-react';
import { cx } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ role, state, children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const beneficiaryNav = [
    { to: '/beneficiary', label: 'Wellbeing Overview', icon: Home, end: true },
    { to: '/beneficiary/checkin', label: 'Daily Assessment', icon: HeartHandshake },
    { to: '/beneficiary/history', label: 'Trajectory & History', icon: TrendingUp },
    { to: '/beneficiary/help', label: 'Support & Crisis Resources', icon: HelpCircle },
  ];

  const counsellorNav = [
    { to: '/counsellor', label: 'Clinical Triage', icon: BarChart3, end: true },
    { to: '/counsellor/cases', label: 'Active Caseload', icon: Users },
    { to: '/counsellor/alerts', label: 'Priority Alerts', icon: Bell, badge: state?.alerts?.filter(a => !a.read).length },
  ];

  const nav = role === 'beneficiary' ? beneficiaryNav : counsellorNav;
  const userName = user?.full_name || (role === 'beneficiary' ? (state?.profile?.name || 'Ananya Sharma') : 'Dr. Kavya Menon');
  const userInitials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || (role === 'beneficiary' ? 'AS' : 'DK');
  const unreadAlerts = state?.alerts?.filter(a => !a.read).length || 0;

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-body">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1480px] items-center justify-between px-4 sm:px-6">
          {/* Left: Brand + Menu trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-sm shadow-teal-900/15 group-hover:scale-105 transition-transform">
                <HeartHandshake size={19} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold tracking-tight text-slate-900">
                    Saathi <span className="text-teal-700">AI</span>
                  </span>
                  <span className="rounded-full border border-teal-200/90 bg-teal-50 px-2 py-0.2 text-[10px] font-semibold text-teal-800 uppercase tracking-wider">
                    {role === 'beneficiary' ? 'Beneficiary' : 'Care Team'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 tracking-wide hidden sm:block">
                  Distress Monitoring & Care Intervention Platform
                </span>
              </div>
            </NavLink>
          </div>

          {/* Right: Engine status, Quick Switcher, Alerts & User profile */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Live Status indicator */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-[11px] font-semibold text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Engine Synced</span>
            </div>

            {/* Quick Role Switcher Button */}
            <button
              onClick={() => navigate(role === 'beneficiary' ? '/counsellor' : '/beneficiary')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 transition cursor-pointer"
              title={`Switch to ${role === 'beneficiary' ? 'Counsellor Portal' : 'Beneficiary Portal'}`}
            >
              <ArrowRightLeft size={13} className="text-slate-400" />
              <span>Switch to {role === 'beneficiary' ? 'Counsellor' : 'Beneficiary'}</span>
            </button>

            {/* Alert bell for counsellor */}
            {role === 'counsellor' && (
              <NavLink
                to="/counsellor/alerts"
                className="relative grid size-9 place-items-center rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition"
              >
                <Bell size={17} />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 grid size-4.5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadAlerts}
                  </span>
                )}
              </NavLink>
            )}

            {/* User Profile Chip */}
            <div className="flex items-center gap-2.5 border-l border-slate-200/80 pl-3">
              <div className="grid size-8.5 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-[12px] font-bold text-white shadow-xs">
                {userInitials}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium capitalize">
                  {role === 'beneficiary' ? 'Survivor / Beneficiary' : 'Senior Clinical Supervisor'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex w-full max-w-[1480px] flex-1">
        {/* Sidebar */}
        <aside className={cx(
          'fixed inset-y-16 left-0 z-30 w-64 border-r border-slate-200/80 bg-white flex flex-col p-4 transition-transform duration-200 lg:static lg:translate-x-0 lg:flex lg:h-[calc(100vh-64px)] lg:sticky lg:top-16',
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}>
          {/* Role Status Card */}
          <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workspace
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                {role === 'beneficiary' ? <User size={12} /> : <Stethoscope size={12} />}
                {role === 'beneficiary' ? 'Wellbeing' : 'Clinical'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
              {role === 'beneficiary'
                ? 'Private emotional reflection and AI-monitored wellbeing space.'
                : 'Caseload triage, Gemini clinical synthesis, and care coordination.'}
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex-1 sidebar-nav overflow-y-auto space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
            {nav.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => cx(
                  'group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-teal-50 text-teal-900 border-l-3 border-teal-600 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={16} className="shrink-0 text-slate-400 group-hover:text-teal-700 transition" />
                  {label}
                </span>
                {badge > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto border-t border-slate-100 pt-3 space-y-1.5">
            <button
              onClick={() => navigate(role === 'beneficiary' ? '/counsellor' : '/beneficiary')}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-teal-800 transition"
            >
              <span className="flex items-center gap-2">
                <ArrowRightLeft size={14} className="text-slate-400" />
                Go to {role === 'beneficiary' ? 'Counsellor Portal' : 'Beneficiary Space'}
              </span>
              <ChevronRight size={13} className="text-slate-400" />
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out
            </button>
            <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 text-center">
              SIH Problem Statement 26094
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

