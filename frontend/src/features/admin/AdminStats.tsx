import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/api/admin';

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const duration = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  hint?: string;
  delayClass?: string;
}

function StatCard({ label, value, icon, gradient, hint, delayClass = '' }: StatCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300/40 dark:hover:shadow-black/50 animate-fade-in-up ${delayClass}`}
    >
      {/* Decorative gradient blob */}
      <div
        className={`pointer-events-none absolute -right-10 -top-10 w-36 h-36 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl transition-all duration-700 group-hover:opacity-25 group-hover:scale-125`}
      />
      {/* Bottom accent line on hover */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${gradient} translate-y-1 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100`}
      />

      <div className="relative flex items-start justify-between">
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3`}
        >
          {icon}
        </div>
        {hint && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400">
            {hint}
          </span>
        )}
      </div>
      <div className="relative mt-4">
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
          <AnimatedNumber value={value} />
        </div>
        <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider font-semibold">
          {label}
        </div>
      </div>
    </div>
  );
}

function StatSkeleton({ delayClass = '' }: { delayClass?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 animate-fade-in-up ${delayClass}`}
    >
      <div className="w-12 h-12 rounded-2xl skeleton-shimmer" />
      <div className="mt-4 h-8 w-20 rounded skeleton-shimmer" />
      <div className="mt-2 h-3 w-24 rounded skeleton-shimmer" />
    </div>
  );
}

export function AdminStats() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatSkeleton key={i} delayClass={`stagger-${i + 1}`} />
        ))}
      </div>
    );
  }

  const publicPct = data?.decks_total
    ? Math.round(((data.public_decks ?? 0) / data.decks_total) * 100)
    : 0;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label={t('admin.stat.users')}
        value={data?.users_total ?? 0}
        gradient="from-indigo-500 via-violet-500 to-purple-600"
        delayClass="stagger-1"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />
      <StatCard
        label={t('admin.stat.decks')}
        value={data?.decks_total ?? 0}
        gradient="from-emerald-500 via-teal-500 to-cyan-600"
        delayClass="stagger-2"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 7l10-5 10 5-10 5L2 7z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        }
      />
      <StatCard
        label={t('admin.stat.publicDecks')}
        value={data?.public_decks ?? 0}
        gradient="from-sky-500 via-blue-500 to-indigo-600"
        hint={`${publicPct}%`}
        delayClass="stagger-3"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        }
      />
      <StatCard
        label={t('admin.stat.stories')}
        value={data?.stories_total ?? 0}
        gradient="from-amber-500 via-orange-500 to-red-500"
        delayClass="stagger-4"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        }
      />
      <StatCard
        label={t('admin.stat.gameSessions')}
        value={data?.game_sessions_total ?? 0}
        gradient="from-rose-500 via-pink-500 to-fuchsia-600"
        delayClass="stagger-5"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="11" x2="10" y2="11" />
            <line x1="8" y1="9" x2="8" y2="13" />
            <line x1="15" y1="12" x2="15.01" y2="12" />
            <line x1="18" y1="10" x2="18.01" y2="10" />
            <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z" />
          </svg>
        }
      />
    </div>
  );
}
