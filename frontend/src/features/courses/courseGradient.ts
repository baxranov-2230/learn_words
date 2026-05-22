export const COURSE_COLOR_OPTIONS = [
  { key: 'indigo', gradient: 'from-primary-500 via-primary-600 to-sky-500' },
  { key: 'emerald', gradient: 'from-success-500 via-success-600 to-teal-600' },
  { key: 'amber', gradient: 'from-xp-400 via-streak-500 to-lives-500' },
  { key: 'sky', gradient: 'from-sky-400 via-sky-500 to-primary-600' },
  { key: 'rose', gradient: 'from-lives-500 via-lives-600 to-streak-500' },
  { key: 'fuchsia', gradient: 'from-primary-500 via-primary-600 to-sky-400' },
] as const;

const GRADIENT_BY_KEY: Record<string, string> = Object.fromEntries(
  COURSE_COLOR_OPTIONS.map((o) => [o.key, o.gradient]),
);

const FALLBACK_GRADIENTS = COURSE_COLOR_OPTIONS.map((o) => o.gradient);

export function courseGradient(
  colorKey: string | null | undefined,
  seed: string = '',
): string {
  if (colorKey && GRADIENT_BY_KEY[colorKey]) return GRADIENT_BY_KEY[colorKey];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACK_GRADIENTS[h % FALLBACK_GRADIENTS.length];
}
