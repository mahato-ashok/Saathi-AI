import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cx } from '../../utils/helpers';

export default function TrendChip({ trend, className = '' }) {
  if (trend === 'rising') {
    return (
      <span className={cx('inline-flex items-center gap-1 rounded-full border border-rose-200/90 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-rose-700', className)}>
        <TrendingUp size={12} className="text-rose-600" />
        Rising
      </span>
    );
  }
  if (trend === 'falling') {
    return (
      <span className={cx('inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-700', className)}>
        <TrendingDown size={12} className="text-emerald-600" />
        Falling
      </span>
    );
  }
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-slate-600', className)}>
      <Minus size={12} className="text-slate-400" />
      Stable
    </span>
  );
}

