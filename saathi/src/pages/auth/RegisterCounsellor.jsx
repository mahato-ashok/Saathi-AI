import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Stethoscope, Mail, Lock, User, Briefcase, Building,
  ArrowRight, Eye, EyeOff, AlertCircle, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authRegister } from '../../utils/api';

function Field({ id, label, icon: Icon, error: ferr, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        {children}
      </div>
      {ferr && <p className="mt-1 text-xs text-rose-600 font-medium">{ferr}</p>}
    </div>
  );
}

function inputCls(hasIcon = true) {
  return `w-full rounded-xl border border-slate-200 bg-slate-50/50 ${hasIcon ? 'pl-10' : 'pl-3.5'} pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none`;
}

export default function RegisterCounsellor() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    organization: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Professional email is required';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setLoading(true);
    try {
      const areaVal = [form.specialization, form.organization].filter(Boolean).join(' • ') || 'Clinical Care Team';
      const res = await authRegister({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'counsellor',
        area: areaVal,
      });
      login(res.access_token, res.user);
      navigate('/counsellor', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          to="/login/counsellor"
          className="text-xs font-semibold text-slate-600 hover:text-indigo-700 transition"
        >
          Care Team Sign In →
        </NavLink>
      </div>

      {/* Main Card */}
      <div className="mx-auto w-full max-w-lg my-auto animate-slide-up py-4">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Join the Care Team
            </h1>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Register as a clinical supervisor, mental health counsellor, or care coordinator.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="c-name" label="Full name and title" icon={User} error={fieldErrors.full_name}>
              <input
                id="c-name"
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="e.g. Dr. Kavya Menon"
                className={inputCls()}
              />
            </Field>

            <Field id="c-email" label="Professional email" icon={Mail} error={fieldErrors.email}>
              <input
                id="c-email"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="kavya@careteam.org"
                className={inputCls()}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="c-spec" label="Clinical specialty" icon={Briefcase}>
                <input
                  id="c-spec"
                  type="text"
                  value={form.specialization}
                  onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))}
                  placeholder="e.g. Trauma Recovery"
                  className={inputCls()}
                />
              </Field>
              <Field id="c-org" label="Hospital / Center" icon={Building}>
                <input
                  id="c-org"
                  type="text"
                  value={form.organization}
                  onChange={e => setForm(p => ({ ...p, organization: e.target.value }))}
                  placeholder="e.g. Apex Health"
                  className={inputCls()}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field id="c-password" label="Password" icon={Lock} error={fieldErrors.password}>
                <div className="relative">
                  <input
                    id="c-password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              <Field id="c-confirm" label="Confirm password" icon={Lock} error={fieldErrors.confirmPassword}>
                <input
                  id="c-confirm"
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat password"
                  className={inputCls()}
                />
              </Field>
            </div>

            <button
              id="counsellor-reg-btn"
              type="submit"
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 text-sm font-semibold text-white shadow-xs hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating clinical account…
                </span>
              ) : (
                <>
                  Register Clinical Account
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-500">
              Already registered on the care team?{' '}
              <NavLink to="/login/counsellor" className="font-semibold text-indigo-700 hover:text-indigo-800">
                Sign in here
              </NavLink>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-indigo-600" />
          <span>Credentialed Care Team Verification · HIPAA Framework</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl py-2 text-center text-xs text-slate-400">
        Saathi AI · SIH Problem Statement 26094
      </div>
    </div>
  );
}
