export const COURSE_COLOR_OPTIONS = [
  { key: 'indigo', gradient: 'from-indigo-500 via-violet-500 to-purple-600' },
  { key: 'emerald', gradient: 'from-emerald-500 via-teal-500 to-cyan-600' },
  { key: 'amber', gradient: 'from-amber-500 via-orange-500 to-red-500' },
  { key: 'sky', gradient: 'from-sky-500 via-blue-500 to-indigo-600' },
  { key: 'rose', gradient: 'from-rose-500 via-pink-500 to-fuchsia-600' },
  { key: 'fuchsia', gradient: 'from-fuchsia-500 via-purple-500 to-violet-600' },
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
