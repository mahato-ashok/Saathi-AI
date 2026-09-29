import {
  Activity, AlertCircle, Heart, HeartHandshake,
  Moon, Phone, PhoneCall, Sun, UserCheck, Wind,
  ExternalLink, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { cx } from '../../utils/helpers';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import AIDisclaimer from '../../components/ui/AIDisclaimer';

export default function HelpPage({ state }) {
  const emergencyHotlines = [
    {
      title: 'National Emergency Response',
      phone: '112',
      tel: '112',
      desc: 'Immediate nationwide police, medical, and crisis dispatch support across India.',
      badge: 'Immediate Dispatch',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      title: 'iCall Psychosocial Helpline',
      phone: '9152987821',
      tel: '+919152987821',
      desc: 'Free, confidential mental health counselling provided by trained clinical psychologists (TISS).',
      badge: 'Mon–Sat · 10am–8pm',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    {
      title: 'Vandrevala Foundation Helpline',
      phone: '9999 666 555 / 1860 2662 345',
      tel: '+919999666555',
      desc: '24/7 professional mental health counselling and active suicide prevention crisis intervention.',
      badge: '24/7 Toll-Free Support',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
    {
      title: 'KIRAN National Mental Health',
      phone: '1800-599-0019',
      tel: '18005990019',
      desc: 'Ministry of Social Justice 24/7 helpline providing psychological first aid and clinical triage.',
      badge: '24/7 Govt. Verified',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  const groundingTechniques = [
    {
      icon: Wind,
      title: 'Box Breathing (4×4 Technique)',
      desc: 'Inhale through nose for 4 counts → Hold full for 4 counts → Exhale smoothly for 4 counts → Hold empty for 4 counts. Repeat for 4 cycles to stimulate the vagus nerve.',
      tag: 'Physiological Reset',
    },
    {
      icon: Sun,
      title: '5-4-3-2-1 Sensory Grounding',
      desc: 'Notice 5 items you see, 4 physical sensations you feel, 3 distinct sounds you hear, 2 scents you smell, and 1 taste. Reorients conscious awareness to immediate reality.',
      tag: 'Cognitive Anchoring',
    },
    {
      icon: Activity,
      title: 'Bilateral Somatic Pacing',
      desc: 'Cross your hands over your chest (butterfly hug) and rhythmically tap your collarbones alternating left and right. Balances inter-hemispheric brain activity.',
      tag: 'Somatic Release',
    },
    {
      icon: Moon,
      title: 'Restorative Sleep Hygiene',
      desc: 'Disconnect screens 45 minutes prior to sleep. Keep ambient light low. Progressive muscle relaxation from toes to forehead reduces cortisol buildup.',
      tag: 'Neuro-Recovery',
    },
  ];

  return (
    <Layout role="beneficiary" state={state}>
      <PageHeader
        eyebrow="Safety & Crisis Protocol"
        title="Support & Crisis Resources"
        description="Compassionate, verified clinical hotlines and grounding interventions. You are never alone — help is confidential and accessible 24/7."
      />

      {/* Immediate Emergency Callout */}
      <div className="mb-6 rounded-2xl border border-rose-200/90 bg-rose-50/80 p-5 sm:p-6 shadow-xs animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-600 text-white shadow-xs">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-rose-950">
                Are you in immediate physical danger or crisis?
              </h2>
              <p className="mt-1 text-xs text-rose-800 leading-relaxed max-w-2xl">
                If you are in immediate danger or experiencing self-harm urges, please reach emergency services (112) or contact a trusted hospital helpline immediately.
              </p>
            </div>
          </div>
          <a
            href="tel:112"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition shrink-0"
          >
            <PhoneCall size={16} />
            <span>Call 112 (Emergency)</span>
          </a>
        </div>
      </div>

      {/* Verified Helplines Grid */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-base text-slate-900 mb-3">
          Verified Mental Health Helplines
        </h2>
        <div className="grid gap-4 md:grid-cols-2 animate-slide-up">
          {emergencyHotlines.map((item) => (
            <Card key={item.title} className="p-5 clinical-card flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                      <Phone size={16} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900">{item.title}</h3>
                      <div className="font-mono text-xs font-bold text-teal-800">{item.phone}</div>
                    </div>
                  </div>
                  <span className={cx('rounded-full border px-2.5 py-0.5 text-[10px] font-semibold', item.badgeClass)}>
                    {item.badge}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`tel:${item.tel}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
                >
                  <PhoneCall size={13} />
                  <span>Call {item.phone}</span>
                </a>
                <span className="text-[11px] text-slate-400">Toll-Free & Confidential</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Clinical Grounding Interventions */}
      <Card className="clinical-card p-6 animate-slide-up">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="font-display font-bold text-base text-slate-900">
            Clinical Self-Regulation & Grounding Techniques
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Evidence-based somatic and cognitive exercises for acute stress and sensory de-escalation
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {groundingTechniques.map(({ icon: Icon, title, desc, tag }) => (
            <div key={title} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4.5 flex gap-3.5 items-start">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white border border-slate-200/80 text-teal-700 shadow-2xs">
                <Icon size={18} />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-xs text-slate-900">{title}</h3>
                  <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {tag}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6">
        <AIDisclaimer />
      </div>
    </Layout>
  );
}
