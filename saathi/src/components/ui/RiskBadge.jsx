import { cx } from '../../utils/helpers';

export default function RiskBadge({ level, size = 'sm', showSubtext = false, className = '' }) {
  const configs = {
    Low: {
      pill: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
      dot: 'bg-emerald-500',
      ring: 'ring-emerald-400/30',
      label: 'Low Risk',
      subtext: 'Within normal baseline',
    },
    Moderate: {
      pill: 'bg-amber-50 text-amber-800 border-amber-200/90',
      dot: 'bg-amber-500',
      ring: 'ring-amber-400/30',
      label: 'Moderate Risk',
      subtext: 'Active monitoring',
    },
    High: {
      pill: 'bg-rose-50 text-rose-800 border-rose-200/90',
      dot: 'bg-rose-500',
      ring: 'ring-rose-400/30',
      label: 'High Risk',
      subtext: 'Escalation required',
    },
  };

  const current = configs[level] || {
    pill: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    ring: 'ring-slate-300',
    label: level || 'Unknown',
    subtext: '',
  };

  if (size === 'lg') {
    return (
      <div className={cx('inline-flex flex-col items-start gap-0.5', className)}>
        <span className={cx(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
          current.pill
        )}>
          <span className={cx('size-2 rounded-full ring-2', current.dot, current.ring, level === 'High' && 'animate-pulse')} />
          {level} Risk
        </span>
        {showSubtext && (
          <span className="text-[11px] font-medium text-slate-500 pl-1">{current.subtext}</span>
        )}
      </div>
    );
  }

  return (
    <span className={cx(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
      current.pill,
      className
    )}>
      <span className={cx('size-1.5 rounded-full ring-2', current.dot, current.ring, level === 'High' && 'animate-pulse')} />
      {level}
    </span>
  );
}

