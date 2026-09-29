import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  HeartHandshake, Mail, Lock, ArrowRight, Eye, EyeOff,
  AlertCircle, ShieldCheck, Sparkles, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authLogin } from '../../utils/api';

export default function LoginBeneficiary() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/beneficiary';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const DEMO_ACCOUNTS = [
    { name: 'Ashok Kumar', email: 'ashok79911@gmail.com', password: 'ashok123', tag: 'High Risk (70)' },
    { name: 'Ananya Sharma', email: 'ananya@example.com', password: 'Password@123', tag: 'Low Risk (30)' },
    { name: 'Rohan Das', email: 'rohan@example.com', password: 'Password@123', tag: 'Moderate (61)' },
    { name: 'Meera Kumari', email: 'meera@example.com', password: 'Password@123', tag: 'High (82)' },
    { name: 'Priya Patel', email: 'priya@example.com', password: 'Password@123', tag: 'Low (34)' },
  ];

  function selectDemoAccount(acc) {
    setForm({
      email: acc.email,
      password: acc.password,
    });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authLogin(form.email, form.password, 'beneficiary');
      login(res.access_token, res.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials or use the demo login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 flex flex-col justify-between p-4 sm:p-6 font-body">
      {/* Top Header */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between py-2">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-xs">
            <HeartHandshake size={18} />
          </div>
          <div>
            <span className="font-display text-base font-bold text-slate-900 tracking-tight">
              Saathi <span className="text-teal-700">AI</span>
            </span>
          </div>
        </NavLink>

        <NavLink
          to="/login/counsellor"
          className="text-xs font-semibold text-slate-600 hover:text-teal-700 transition"
        >
          Care Team Sign In →
        </NavLink>
      </div>

      {/* Main Card Container */}
      <div className="mx-auto w-full max-w-md my-auto animate-slide-up">
        {/* Role Segmented Selector */}
        <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold text-slate-600">
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-teal-900 shadow-xs">
            <HeartHandshake size={14} className="text-teal-600" />
            Beneficiary
          </div>
          <NavLink
            to="/login/counsellor"
            className="flex items-center justify-center gap-1.5 rounded-lg py-2 hover:text-slate-900 transition"
          >
            Counsellor Portal
          </NavLink>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Sign in to your private wellbeing space to reflect and track your progress.
            </p>
          </div>

          {/* Quick Demo Fill Helper */}
          <div className="mb-5 rounded-2xl border border-teal-100 bg-teal-50/70 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                <Sparkles size={14} className="text-teal-600" />
                <span>Quick Test Accounts</span>
              </div>
              <span className="text-[10px] text-teal-700 font-medium">Click to fill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => selectDemoAccount(acc)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition cursor-pointer ${form.email === acc.email
                      ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                      : 'bg-white text-slate-700 border-teal-200 hover:bg-teal-100/70 hover:text-teal-900'
                    }`}
                  title={`${acc.email} (${acc.tag})`}
                >
                  <span>{acc.name.split(' ')[0]}</span>
                  <span className="ml-1 opacity-70 text-[10px]">({acc.tag.split(' ')[0]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="beneficiary-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="ananya@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="beneficiary-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="beneficiary-login-btn"
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl gradient-teal py-3 text-sm font-semibold text-white shadow-xs hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in…
                </span>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center space-y-2">
            <p className="text-xs text-slate-500">
              New here?{' '}
              <NavLink to="/register/beneficiary" className="font-semibold text-teal-700 hover:text-teal-800">
                Create a confidential account
              </NavLink>
            </p>
            <p className="text-[11px] text-slate-400">
              Are you a clinical supervisor or counsellor?{' '}
              <NavLink to="/login/counsellor" className="font-semibold text-slate-600 hover:text-teal-700">
                Sign in to Care Team →
              </NavLink>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-teal-600" />
          <span>Encrypted Session · Protected Health Information Architecture</span>
        </div>
      </div>

      {/* Footer info */}
      <div className="mx-auto w-full max-w-5xl py-2 text-center text-xs text-slate-400">
        Saathi AI · SIH Problem Statement 26094 · PostgreSQL 18 & FastAPI
      </div>
    </div>
  );
}

