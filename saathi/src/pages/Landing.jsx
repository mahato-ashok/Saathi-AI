import { NavLink } from 'react-router-dom';
import {
  Activity, ArrowRight, Brain, HeartHandshake,
  Heart, Shield, Stethoscope, User, LogOut, Lock,
  CheckCircle2, Sparkles, AlertCircle, PhoneCall,
  Server, Cpu, ShieldCheck, Database, Layers
} from 'lucide-react';
import { cx } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import AIDisclaimer from '../components/ui/AIDisclaimer';

function GatewayCard({ to, loginTo, icon: Icon, badge, title, subtitle, bullets, ctaLabel, accent = 'teal' }) {
  const isTeal = accent === 'teal';

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-7 clinical-card transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
      {/* Subtle background glow */}
      <div
        className={cx(
          'pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-70',
          isTeal ? 'bg-teal-100' : 'bg-indigo-100'
        )}
      />

      <div className="relative">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div
            className={cx(
              'grid size-12 place-items-center rounded-xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105',
              isTeal ? 'bg-teal-700 shadow-teal-700/20' : 'bg-slate-900 shadow-slate-900/20'
            )}
          >
            <Icon size={22} />
          </div>
          <span
            className={cx(
              'rounded-full px-3 py-1 text-xs font-semibold tracking-wide border',
              isTeal
                ? 'bg-teal-50 text-teal-800 border-teal-200/80'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200/80'
            )}
          >
            {badge}
          </span>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

        {/* Bullet points */}
        <div className="mt-6 space-y-2.5 pt-5 border-t border-slate-100">
          {bullets.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
              <CheckCircle2
                size={15}
                className={cx('shrink-0 mt-0.5', isTeal ? 'text-teal-600' : 'text-indigo-600')}
              />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
        <NavLink
          to={to}
          className={cx(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150',
            isTeal
              ? 'bg-teal-700 hover:bg-teal-800 hover:shadow-teal-700/20'
              : 'bg-slate-900 hover:bg-slate-800 hover:shadow-slate-900/20'
          )}
        >
          <span>{ctaLabel}</span>
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </NavLink>

        {loginTo && (
          <NavLink
            to={loginTo}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 rounded-md hover:bg-slate-50"
          >
            Sign In Portal →
          </NavLink>
        )}
      </div>
    </div>
  );
}

export default function Landing() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* ── Top Executive Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-teal-700 text-white shadow-sm shadow-teal-700/20">
              <HeartHandshake size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base">Saathi AI</span>
                <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                  CDS Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Multimodal Distress Monitoring & Care Intervention
              </p>
            </div>
          </div>

          {/* Engine Status & Auth */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>BytePulse ML Online</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <NavLink
                  to={user?.role === 'counsellor' ? '/counsellor' : '/beneficiary'}
                  className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/80 px-3.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-sm"
                >
                  <span className="size-2 rounded-full bg-teal-600" />
                  <span className="font-medium">{user?.full_name}</span>
                  <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded">
                    {user?.role}
                  </span>
                </NavLink>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/login/beneficiary"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  Beneficiary Login
                </NavLink>
                <NavLink
                  to="/login/counsellor"
                  className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Counsellor Portal
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Soft radial background accents */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[450px] w-[750px] rounded-full bg-gradient-to-tr from-teal-100/40 via-emerald-50/30 to-indigo-100/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/90 bg-teal-50/80 px-4 py-1.5 text-xs font-semibold text-teal-800 shadow-xs">
            <Brain size={14} className="text-teal-700" />
            <span>SIH Problem Statement 26094 · Clinical Decision Support System</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl font-display">
            Compassionate Care,{' '}
            <span className="text-teal-700">Backed by Objective</span>
            <br />
            Behavioral Signals.
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
            Saathi bridges daily beneficiary self-reporting with proactive clinical triage.
            Combining <span className="font-semibold text-slate-800">DistilRoBERTa</span> linguistic sentiment analysis,{' '}
            <span className="font-semibold text-slate-800">Isolation Forest</span> behavioral anomaly detection, and{' '}
            <span className="font-semibold text-slate-800">Google Gemini</span> clinical decision support.
          </p>

          {/* ── Dual Gateway Portals ── */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 text-left max-w-4xl mx-auto">
            <GatewayCard
              to="/beneficiary"
              loginTo="/login/beneficiary"
              icon={User}
              badge="Beneficiary Portal"
              title="Individual & Patient Space"
              subtitle="Daily confidential wellness check-ins, longitudinal distress trajectory tracking, and empathetic AI companion."
              bullets={[
                '5-dimensional standardized Likert wellbeing evaluation',
                'Saathi conversational companion powered by Gemini Flash',
                'Real-time behavioral distress scores & reflection journal',
                'Direct one-click emergency crisis helpline integration',
              ]}
              ctaLabel="Enter Beneficiary Space"
              accent="teal"
            />

            <GatewayCard
              to="/counsellor"
              loginTo="/login/counsellor"
              icon={Stethoscope}
              badge="Clinical Care Team"
              title="Counsellor & Triage Station"
              subtitle="Multi-patient triage queue with automated risk stratification, electronic health record review, and intervention documentation."
              bullets={[
                'Multi-patient distress triage queue with urgency classification',
                'AI-assisted clinical note synthesis ready for EHR integration',
                'DistilRoBERTa emotion spectrum & isolation forest anomaly flags',
                'Documented intervention tracking and follow-up scheduling',
              ]}
              ctaLabel="Enter Counsellor Station"
              accent="indigo"
            />
          </div>

          {/* Demo quick access banner */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white/80 p-3.5 text-xs text-slate-600 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-teal-600 shrink-0" />
              <span>
                <strong>Evaluation Mode:</strong> Both portals contain preloaded test data with 1-click demo logins.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <NavLink
                to="/login/beneficiary"
                className="font-semibold text-teal-700 hover:text-teal-900 underline"
              >
                Beneficiary Demo
              </NavLink>
              <span className="text-slate-300">|</span>
              <NavLink
                to="/login/counsellor"
                className="font-semibold text-indigo-700 hover:text-indigo-900 underline"
              >
                Counsellor Demo
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture & Technology Pillars ── */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200/80 px-3 py-1 rounded-full">
              System Architecture
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
              Clinical Rigor Meets Modern AI Telemetry
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Engineered with standardized clinical assessment frameworks and high-assurance backend security.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Brain,
                title: 'Linguistic Sentiment',
                description: 'Fine-tuned DistilRoBERTa classifier detecting anxiety, sadness, and escalation keywords from freeform notes.',
                badge: 'DistilRoBERTa',
              },
              {
                icon: Activity,
                title: 'Anomaly Detection',
                description: 'Unsupervised Isolation Forest algorithm profiling abrupt shifts in behavioral and Likert scores.',
                badge: 'Isolation Forest',
              },
              {
                icon: Cpu,
                title: 'Clinical Synthesis',
                description: 'Google Gemini 3.8 Flash generating structured EHR case summaries and risk factor breakdowns.',
                badge: 'Gemini 3.8 Flash',
              },
              {
                icon: ShieldCheck,
                title: 'Enterprise Security',
                description: 'PostgreSQL 18 persistence, Argon2 password hashing, and scoped JWT role-based access control.',
                badge: 'PostgreSQL & JWT',
              },
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 clinical-card transition-all duration-200 hover:bg-white hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="grid size-10 place-items-center rounded-xl bg-white border border-slate-200 text-teal-700 shadow-xs">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{pillar.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Emergency Tele-MANAS Quick Helpline Strip ── */}
      <section className="bg-slate-900 text-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <PhoneCall size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    24/7 Verified Crisis Lifeline
                  </span>
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                    Toll-Free Govt. of India
                  </span>
                </div>
                <p className="mt-0.5 text-base font-bold text-white">
                  Tele-MANAS (Mental Health Helpline): <span className="font-mono text-teal-300">14416</span> or{' '}
                  <span className="font-mono text-teal-300">1800-891-4416</span>
                </p>
                <p className="text-xs text-slate-400">
                  National Emergency: <span className="font-mono text-white">112</span> · Kiran Helpline: <span className="font-mono text-white">1800-599-0019</span>
                </p>
              </div>
            </div>

            <NavLink
              to="/help"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 hover:bg-slate-100 transition shadow-sm"
            >
              <span>View All Support Resources</span>
              <ArrowRight size={14} />
            </NavLink>
          </div>
        </div>
      </section>

      {/* ── Regulatory Disclaimer & Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto mb-8">
            <AIDisclaimer />
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Saathi AI</span>
              <span>· Smart India Hackathon PS 26094</span>
              <span>· Prototype Build v2.4</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <NavLink to="/login/beneficiary" className="hover:text-slate-900 transition">
                Beneficiary Sign In
              </NavLink>
              <NavLink to="/login/counsellor" className="hover:text-slate-900 transition">
                Care Team Portal
              </NavLink>
              <NavLink to="/help" className="hover:text-slate-900 transition">
                Emergency Directory
              </NavLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
