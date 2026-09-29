// ─────────────────────────────────────────────────────────────────────────────
// HELPERS & UTILS
// ─────────────────────────────────────────────────────────────────────────────

/** Joins class names, filtering out falsy values */
export function cx(...args) {
  return args.filter(Boolean).join(' ');
}

/** Returns risk level string based on distress score */
export function getRiskLevel(score) {
  if (score >= 75) return 'High';
  if (score >= 50) return 'Moderate';
  return 'Low';
}

/** Calculates a distress score from check-in answers */
export function calcDistressScore(answers) {
  const { mood, safety, sleep, anxiety, support } = answers;
  const base = 100 - ((mood + safety + sleep + support) * 4.2) + (anxiety * 7.8);
  return Math.max(8, Math.min(96, Math.round(base)));
}
