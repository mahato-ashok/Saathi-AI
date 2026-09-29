import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cx } from '../../utils/helpers';
import Card from './Card';

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  subtext,
  className = '',
}) {
  const iconVariants = {
    default: 'bg-teal-50 text-teal-700 border-teal-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-rose-50 text-rose-700 border-rose-100',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };

  return (
    <Card className={cx('p-5 clinical-card-hover', className)}>
      <div className="flex items-start justify-between">
        <div className={cx('grid size-10 place-items-center rounded-xl border', iconVariants[variant] || iconVariants.default)}>
          <Icon size={18} />
        </div>
        {trendLabel && (
          <div className={cx(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide border',
            trend > 0
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : trend < 0
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          )}>
            {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {trendLabel}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
          {value}
        </div>
        <div className="mt-1 text-xs font-medium text-slate-500">
          {label}
        </div>
        {subtext && (
          <div className="mt-0.5 text-[11px] text-slate-400">
            {subtext}
          </div>
        )}
      </div>
    </Card>
  );
}

