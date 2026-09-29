import { cx, getRiskLevel } from '../../utils/helpers';

export default function DistressGauge({ score, size = 150, showLabel = true }) {
  const level = getRiskLevel(score);
  const r = 48;
  const circ = 2 * Math.PI * r;
  const strokePercent = Math.min(Math.max(score, 0), 100);
  const dash = circ - (strokePercent / 100) * circ;

  const colorConfig = {
    Low: {
      gradientStart: '#10b981',
      gradientEnd: '#059669',
      glow: 'rgba(16, 185, 129, 0.15)',
      text: 'text-emerald-700',
      label: 'Normal Baseline',
      bgRing: '#ecfdf5',
    },
    Moderate: {
      gradientStart: '#f59e0b',
      gradientEnd: '#d97706',
      glow: 'rgba(245, 158, 11, 0.15)',
      text: 'text-amber-700',
      label: 'Elevated Strain',
      bgRing: '#fffbeb',
    },
    High: {
      gradientStart: '#f43f5e',
      gradientEnd: '#e11d48',
      glow: 'rgba(244, 63, 94, 0.15)',
      text: 'text-rose-700',
      label: 'Critical Distress',
      bgRing: '#fff1f2',
    },
  };

  const current = colorConfig[level] || colorConfig.Low;
  const gradientId = `gaugeGrad-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          className="transform -rotate-90 drop-shadow-xs"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={current.gradientStart} />
              <stop offset="100%" stopColor={current.gradientEnd} />
            </linearGradient>
            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor={current.gradientStart} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="9"
          />

          {/* Subtly tinted track */}
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={current.bgRing}
            strokeWidth="8"
            opacity="0.8"
          />

          {/* Active progress ring */}
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="9"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            strokeLinecap="round"
            className="gauge-ring"
            filter={`url(#glow-${gradientId})`}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>

        {/* Inner Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={cx('font-display font-extrabold tracking-tight tabular-nums leading-none', current.text, size >= 140 ? 'text-3xl' : 'text-2xl')}>
            {score}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
            out of 100
          </span>
        </div>
      </div>

      {showLabel && (
        <span className={cx('mt-1.5 text-xs font-semibold tracking-wide', current.text)}>
          {current.label}
        </span>
      )}
    </div>
  );
}

