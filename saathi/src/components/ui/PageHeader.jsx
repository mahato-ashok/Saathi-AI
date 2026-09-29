import { cx } from '../../utils/helpers';

export default function PageHeader({ eyebrow, title, description, action, badge, className = '' }) {
  return (
    <div className={cx('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-in', className)}>
      <div>
        {eyebrow && (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-teal-800">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-2.5">
          {action}
        </div>
      )}
    </div>
  );
}

