import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { progressApi } from '@/api/progress';
import { coursesApi } from '@/api/courses';
import { languagesApi } from '@/api/languages';
import { useAuthStore } from '@/store/authStore';
import { courseGradient } from '@/features/courses/courseGradient';
import { AdminStats } from '@/features/admin/AdminStats';

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['progress-me'],
    queryFn: progressApi.me,
  });
  const { data: due } = useQuery({
    queryKey: ['progress-due'],
    queryFn: () => progressApi.due({ limit: 6 }),
  });
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list(),
  });
  const { data: languages } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languagesApi.list(),
  });

  const featuredCourses = courses?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl gradient-mesh p-5 sm:p-7 lg:p-8 text-white animate-fade-in-up">
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/15 blur-3xl animate-float-slow" />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-fuchsia-300/20 blur-3xl animate-float-slow"
          style={{ animationDelay: '4s' }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-widest font-semibold text-white/80">
              {t('dashboard.greetingPrefix')}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {t('dashboard.greeting', {
                name: user?.username ?? '',
              })}{' '}
              👋
            </h1>
            <p className="text-sm text-white/85 max-w-xl">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary-700 text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {t('dashboard.continueLearning')}
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-sm font-bold hover:bg-white/25 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {t('nav.admin')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          loading={loadingSummary}
          label={t('progress.due')}
          value={summary?.due_now ?? 0}
          gradient="from-rose-500 to-pink-600"
          delayClass="stagger-1"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          loading={loadingSummary}
          label={t('progress.streak')}
          value={summary?.current_streak ?? 0}
          suffix="🔥"
          gradient="from-amber-500 to-orange-600"
          delayClass="stagger-2"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          }
        />
        <StatCard
          loading={loadingSummary}
          label={t('progress.totalCards')}
          value={summary?.total_cards ?? 0}
          gradient="from-sky-500 to-blue-600"
          delayClass="stagger-3"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7l10-5 10 5-10 5L2 7z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          }
        />
        <StatCard
          loading={loadingSummary}
          label={t('progress.mastered')}
          value={summary?.mastered ?? 0}
          gradient="from-emerald-500 to-teal-600"
          delayClass="stagger-4"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </div>

      {/* Languages quick row */}
      {languages && languages.length > 0 && (
        <section className="space-y-3 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              {t('dashboard.languages')}
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
            {languages.map((l) => {
              const grad = courseGradient(l.color, l.code);
              return (
                <Link
                  key={l.id}
                  to={`/courses?language=${l.id}`}
                  className={`group relative flex-shrink-0 inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden`}
                >
                  <span
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-10 transition-opacity`}
                  />
                  <span
                    className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${grad} text-white shadow-md text-base font-extrabold flex-shrink-0`}
                  >
                    {l.flag || l.code.toUpperCase().slice(0, 2)}
                  </span>
                  <span className="relative">
                    <span className="block text-sm font-bold leading-tight">
                      {l.name}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
                      {l.courses_count} {t('courses.title').toLowerCase()}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Featured courses */}
        <section className="lg:col-span-2 space-y-3 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </span>
              {t('dashboard.featuredCourses')}
            </h2>
            <Link
              to="/courses"
              className="text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('dashboard.seeAll')} →
            </Link>
          </div>
          {featuredCourses.length === 0 ? (
            <EmptyHint
              text={t('dashboard.noCourses')}
              cta={isAdmin ? t('admin.courses.newTitle') : null}
              ctaLink="/admin?tab=courses"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {featuredCourses.map((c, i) => {
                const g = courseGradient(c.cover_color, c.title);
                return (
                  <Link
                    key={c.id}
                    to={`/courses/${c.id}`}
                    className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:-translate-y-0.5 hover:shadow-lg transition-all animate-fade-in-up stagger-${(i % 6) + 1}`}
                  >
                    <div
                      className={`relative h-20 bg-gradient-to-br ${g} overflow-hidden`}
                    >
                      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/20 blur-xl" />
                      <div className="relative h-full p-3 flex items-end justify-between text-white">
                        {c.level && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/25 backdrop-blur-sm">
                            {c.level}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-bold truncate">{c.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          📚 {c.decks_count}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          📖 {c.stories_count}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Sidebar: due review */}
        <section className="space-y-3 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              {t('progress.due')}
            </h2>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
            {!due?.length ? (
              <div className="px-5 py-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-xs text-slate-500">
                  {t('dashboard.allCaughtUp')}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {due.slice(0, 6).map((c, i) => (
                  <li
                    key={c.id}
                    className={`px-4 py-2.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors animate-fade-in-up stagger-${(i % 6) + 1}`}
                  >
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-500/15 dark:to-pink-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {c.term}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {c.definition}
                      </div>
                    </div>
                    <Link
                      to={`/decks/${c.deck_id}/play/flashcards`}
                      className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Admin shortcuts */}
      {isAdmin && (
        <section className="space-y-4 animate-fade-in-up stagger-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            {t('dashboard.adminShortcuts')}
          </h2>

          {/* Platform stats */}
          <AdminStats />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminShortcut
              to="/admin?tab=languages"
              label={t('admin.tab.languages')}
              gradient="from-emerald-500 to-teal-600"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              }
              delayClass="stagger-1"
            />
            <AdminShortcut
              to="/admin?tab=courses"
              label={t('admin.tab.courses')}
              gradient="from-fuchsia-500 to-purple-600"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              }
              delayClass="stagger-2"
            />
            <AdminShortcut
              to="/admin?tab=stories"
              label={t('admin.tab.stories')}
              gradient="from-amber-500 to-orange-600"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              }
              delayClass="stagger-3"
            />
            <AdminShortcut
              to="/admin?tab=users"
              label={t('admin.tab.users')}
              gradient="from-sky-500 to-blue-600"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              }
              delayClass="stagger-4"
            />
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon,
  gradient,
  delayClass,
  loading,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  gradient: string;
  delayClass: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div
        className={`rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 sm:p-5 animate-fade-in-up ${delayClass}`}
      >
        <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
        <div className="mt-3 h-7 w-16 rounded skeleton-shimmer" />
        <div className="mt-2 h-3 w-20 rounded skeleton-shimmer" />
      </div>
    );
  }
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all animate-fade-in-up ${delayClass}`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-20 group-hover:scale-110 transition-all duration-500`}
      />
      <div className="relative">
        <div
          className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}
        >
          {icon}
        </div>
        <div className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums">
          {value.toLocaleString()}
          {suffix && <span className="text-base sm:text-lg ml-1">{suffix}</span>}
        </div>
        <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
          {label}
        </div>
      </div>
    </div>
  );
}

function EmptyHint({
  text,
  cta,
  ctaLink,
}: {
  text: string;
  cta: string | null;
  ctaLink: string;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
      <p className="text-sm text-slate-500 mb-3">{text}</p>
      {cta && (
        <Link
          to={ctaLink}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          {cta} →
        </Link>
      )}
    </div>
  );
}

function AdminShortcut({
  to,
  label,
  gradient,
  icon,
  delayClass,
}: {
  to: string;
  label: string;
  gradient: string;
  icon: React.ReactNode;
  delayClass: string;
}) {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all animate-fade-in-up ${delayClass}`}
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-25 group-hover:scale-110 transition-all duration-500`}
      />
      <div className="relative flex items-center gap-3">
        <span
          className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 flex-shrink-0`}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{label}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest font-semibold flex items-center gap-1">
            <span>open</span>
            <svg className="group-hover:translate-x-1 transition-transform" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
