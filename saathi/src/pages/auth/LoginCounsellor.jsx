import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Stethoscope, Mail, Lock, ArrowRight, Eye, EyeOff,
  AlertCircle, Shield, Sparkles, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authLogin } from '../../utils/api';

export default function LoginCounsellor() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/counsellor';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function fillDemo() {
    setForm({
      email: 'kavya@careteam.org',
      password: 'Password@123',
    });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authLogin(form.email, form.password, 'counsellor');
      login(res.access_token, res.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials or use the demo login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100 flex flex-col justify-between p-4 sm:p-6 font-body">
      {/* Top Header */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between py-2">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xs">
            <Stethoscope size={18} />
          </div>
          <div>
            <span className="font-display text-base font-bold text-slate-900 tracking-tight">
              Saathi <span className="text-indigo-700">Clinical</span>
            </span>
          </div>
        </NavLink>

        <NavLink
          to="/login/beneficiary"
          className="text-xs font-semibold text-slate-600 hover:text-indigo-700 transition"
        >
          ← Beneficiary Portal
        </NavLink>
      </div>

      {/* Main Card Container */}
      <div className="mx-auto w-full max-w-md my-auto animate-slide-up">
        {/* Role Segmented Selector */}
        <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold text-slate-600">
          <NavLink
            to="/login/beneficiary"
            className="flex items-center justify-center gap-1.5 rounded-lg py-2 hover:text-slate-900 transition"
          >
            Beneficiary
          </NavLink>
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-indigo-900 shadow-xs">
            <Stethoscope size={14} className="text-indigo-600" />
            Counsellor Portal
          </div>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Care Team Sign In
            </h1>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Clinical decision support, caseload triage, and intervention management.
            </p>
          </div>

          {/* Quick Demo Fill Helper */}
          <div className="mb-5 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-600" />
              <div className="text-left">
                <div className="text-xs font-bold text-indigo-950">Testing clinical portal?</div>
                <div className="text-[11px] text-indigo-700">Fill test supervisor (Dr. Kavya)</div>
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-indigo-800 border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition cursor-pointer"
            >
              Fill Demo
            </button>
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
                Professional email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="counsellor-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="kavya@careteam.org"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
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
                  id="counsellor-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
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
              id="counsellor-login-btn"
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 text-sm font-semibold text-white shadow-xs hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Authenticating credentials…
                </span>
              ) : (
                <>
                  Access Clinical Dashboard
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center space-y-2">
            <p className="text-xs text-slate-500">
              New clinical provider?{' '}
              <NavLink to="/register/counsellor" className="font-semibold text-indigo-700 hover:text-indigo-800">
                Register credentialed account
              </NavLink>
            </p>
            <p className="text-[11px] text-slate-400">
              Are you a beneficiary?{' '}
              <NavLink to="/login/beneficiary" className="font-semibold text-slate-600 hover:text-indigo-700">
                Sign in to Wellbeing Portal →
              </NavLink>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Shield size={14} className="text-indigo-600" />
          <span>Restricted Clinical Access · Multi-Tenant RBAC Authorization</span>
        </div>
      </div>

      {/* Footer info */}
      <div className="mx-auto w-full max-w-5xl py-2 text-center text-xs text-slate-400">
        Saathi AI · SIH Problem Statement 26094 · PostgreSQL 18 & FastAPI
      </div>
    </div>
  );
}

