import { ShieldAlert, Info } from 'lucide-react';
import { cx } from '../../utils/helpers';

export default function AIDisclaimer({ compact = false, className = '' }) {
  if (compact) {
    return (
      <div className={cx('flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs text-slate-500', className)}>
        <Info size={14} className="shrink-0 text-teal-700" />
        <span>Clinical Decision Support System — All AI signals require licensed human evaluation.</span>
      </div>
    );
  }

  return (
    <div className={cx('flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]', className)}>
      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
        <ShieldAlert size={16} />
      </div>
      <div className="text-left">
        <p className="font-display text-xs font-bold text-slate-800 tracking-tight">
          Clinical Decision Support (CDS) Advisory · Human-in-the-Loop Protocol
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Saathi AI synthesizes multimodal behavioural signals, natural language emotion cues, and anomaly trajectories solely to assist trained care coordinators and clinical teams. AI outputs do not constitute a formal diagnosis, medical prognosis, or crisis triage determination.
        </p>
      </div>
    </div>
  );
}

