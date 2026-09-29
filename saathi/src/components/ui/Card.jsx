import { cx } from '../../utils/helpers';

export default function Card({ children, className = '', hover = false, variant = 'default', ...props }) {
  const variantStyles = {
    default: 'border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]',
    subtle: 'border border-slate-100 bg-slate-50/70',
    elevated: 'border border-slate-200/90 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]',
    glass: 'border border-white/70 bg-white/80 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]',
  };

  return (
    <div
      className={cx(
        'rounded-2xl transition-all duration-200',
        variantStyles[variant] || variantStyles.default,
        hover && 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.08)] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

