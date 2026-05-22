import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { progressApi } from '@/api/progress';
import { coursesApi } from '@/api/courses';
import { languagesApi } from '@/api/languages';
import { storiesApi } from '@/api/stories';
import { decksApi } from '@/api/decks';
import { useAuthStore } from '@/store/authStore';
import { courseGradient } from '@/features/courses/courseGradient';
import { AdminStats } from '@/features/admin/AdminStats';

const DAILY_GOAL_XP = 50;

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
  const { data: stories } = useQuery({
    queryKey: ['stories-dashboard'],
    queryFn: () => storiesApi.list(),
  });
  const { data: deckList } = useQuery({
    queryKey: ['decks-dashboard'],
    queryFn: () => decksApi.list({ scope: 'public', page_size: 4 }),
  });

  const featuredCourses = courses?.slice(0, 4) ?? [];
  const featuredStories = stories?.filter((s) => s.is_published).slice(0, 3) ?? [];
  const featuredDecks = deckList?.items?.slice(0, 4) ?? [];
  const dueCount = summary?.due_now ?? 0;
  const todayXp = Math.min((summary?.mastered ?? 0) * 10, DAILY_GOAL_XP * 2);

  return (
    <div className="space-y-6 lg:space-y-7">
      {/* ===== Streak / XP / Continue hero ===== */}
      <section className="grid gap-4 sm:grid-cols-3 animate-fade-in-up">
        <HeroStat
          kind="streak"
          value={summary?.current_streak ?? 0}
          label={t('progress.streak')}
          loading={loadingSummary}
        />
        <HeroStat
          kind="xp"
          value={(summary?.mastered ?? 0) * 10}
          label="XP"
          loading={loadingSummary}
        />
        <HeroGoal
          xp={todayXp}
          goal={DAILY_GOAL_XP}
          label={t('progress.due')}
          dueCount={dueCount}
        />
      </section>

      {/* ===== Continue learning CTA ===== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-sky-500 p-6 sm:p-8 text-white animate-fade-in-up stagger-2 shadow-xl shadow-primary-500/25">
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="text-xs uppercase tracking-[0.2em] font-extrabold text-white/85">
              {t('dashboard.greetingPrefix')}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {t('dashboard.greeting', { name: user?.username ?? '' })} 👋
            </h1>
            <p className="text-sm font-semibold text-white/85">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/courses"
              className="btn-3d-xp btn-3d-lg whitespace-nowrap"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {t('dashboard.continueLearning')}
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-sm font-extrabold uppercase tracking-wider hover:bg-white/30 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {t('nav.admin')}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ===== Languages quick row ===== */}
      {languages && languages.length > 0 && (
        <section className="space-y-3 animate-fade-in-up stagger-3">
          <SectionHeading
            color="success"
            label={t('dashboard.languages')}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            }
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
            {languages.map((l) => {
              const grad = courseGradient(l.color, l.code);
              return (
                <Link
                  key={l.id}
                  to={`/courses?language=${l.id}`}
                  className="group relative flex-shrink-0 inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-500 hover:-translate-y-0.5 transition-all"
                >
                  <span
                    className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${grad} text-white shadow-md text-base font-extrabold flex-shrink-0`}
                  >
                    {l.flag || l.code.toUpperCase().slice(0, 2)}
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                      {l.name}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
                      {l.courses_count} {t('courses.title').toLowerCase()}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:gap-6 lg:grid-cols-3">
        {/* Featured courses */}
        <section className="lg:col-span-2 space-y-3 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between gap-3">
            <SectionHeading
              color="primary"
              label={t('dashboard.featuredCourses')}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              }
            />
            <Link
              to="/courses"
              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400 hover:underline"
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
                    className={`group card overflow-hidden hover:-translate-y-1 hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-200 animate-fade-in-up stagger-${(i % 6) + 1} p-0`}
                  >
                    <div className={`relative h-24 bg-gradient-to-br ${g} overflow-hidden`}>
                      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/20 blur-xl" />
                      <div className="relative h-full p-3 flex items-end justify-between text-white">
                        {c.level && (
                          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-lg bg-white/25 backdrop-blur-sm">
                            {c.level}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {c.title}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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

        {/* Due review */}
        <section className="space-y-3 animate-fade-in-up stagger-5">
          <SectionHeading
            color="lives"
            label={t('progress.due')}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <div className="card p-0 overflow-hidden">
            {!due?.length ? (
              <div className="px-5 py-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success-100 dark:bg-success-500/15 text-success-600 dark:text-success-400 mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {t('dashboard.allCaughtUp')}
                </p>
              </div>
            ) : (
              <ul className="divide-y-2 divide-slate-100 dark:divide-slate-800">
                {due.slice(0, 6).map((c, i) => (
                  <li
                    key={c.id}
                    className={`px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors animate-fade-in-up stagger-${(i % 6) + 1}`}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-lives-50 dark:bg-lives-500/10 text-lives-500 dark:text-lives-400 text-xs font-extrabold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {c.term}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 truncate">
                        {c.definition}
                      </div>
                    </div>
                    <Link
                      to={`/decks/${c.deck_id}/play/flashcards`}
                      className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
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

      {/* ===== Vocabulary Stats ===== */}
      <section className="grid gap-4 sm:grid-cols-4 animate-fade-in-up stagger-5">
        <VocabStat
          label={t('dashboard.totalWords')}
          value={summary?.total_cards ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
          color="primary"
          loading={loadingSummary}
        />
        <VocabStat
          label={t('dashboard.mastered')}
          value={summary?.mastered ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          color="success"
          loading={loadingSummary}
        />
        <VocabStat
          label={t('dashboard.learning')}
          value={summary?.learning ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
          color="xp"
          loading={loadingSummary}
        />
        <VocabStat
          label={t('dashboard.reviewDue')}
          value={dueCount}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
          color="lives"
          loading={loadingSummary}
        />
      </section>

      {/* ===== Quick Games ===== */}
      <section className="space-y-3 animate-fade-in-up stagger-5">
        <SectionHeading
          color="xp"
          label={t('dashboard.quickGames')}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="15" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
            </svg>
          }
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: t('games.flashcards'), type: 'flashcards', gradient: 'from-primary-500 to-sky-500', icon: '🃏' },
            { name: t('games.test'), type: 'test', gradient: 'from-success-500 to-success-600', icon: '✏️' },
            { name: t('games.match'), type: 'match', gradient: 'from-xp-400 to-streak-500', icon: '🔗' },
            { name: t('games.spelling'), type: 'spelling', gradient: 'from-lives-500 to-lives-600', icon: '🔤' },
          ].map((g, i) => (
            <Link
              key={g.type}
              to="/courses"
              className={`group card p-4 flex flex-col items-center justify-center gap-2.5 text-center hover:-translate-y-1 hover:border-primary-400 dark:hover:border-primary-500 transition-all animate-fade-in-up stagger-${i + 1} min-h-[100px]`}
            >
              <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${g.gradient} text-2xl shadow-md group-hover:scale-110 transition-transform duration-200`}>
                {g.icon}
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {g.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Recent Stories ===== */}
      {featuredStories.length > 0 && (
        <section className="space-y-3 animate-fade-in-up stagger-6">
          <div className="flex items-center justify-between gap-3">
            <SectionHeading
              color="primary"
              label={t('dashboard.recentStories')}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              }
            />
            <Link
              to="/stories"
              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('dashboard.seeAll')} →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {featuredStories.map((story, i) => (
              <Link
                key={story.id}
                to={`/stories/${story.id}`}
                className={`group card p-4 hover:-translate-y-1 hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-200 animate-fade-in-up stagger-${(i % 6) + 1}`}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-sky-500 text-white text-lg flex-shrink-0 shadow-md">
                    📖
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{story.title}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {story.level && (
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-400">
                          {story.level}
                        </span>
                      )}
                      {story.topic && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">{story.topic}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Public Decks ===== */}
      {featuredDecks.length > 0 && (
        <section className="space-y-3 animate-fade-in-up stagger-6">
          <div className="flex items-center justify-between gap-3">
            <SectionHeading
              color="success"
              label={t('dashboard.publicDecks')}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" /><line x1="3" y1="9" x2="21" y2="9" />
                </svg>
              }
            />
            <Link
              to="/decks"
              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('dashboard.seeAll')} →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featuredDecks.map((deck, i) => {
              const g = courseGradient(undefined, deck.title);
              return (
                <Link
                  key={deck.id}
                  to={`/decks/${deck.id}/play/flashcards`}
                  className={`group card p-4 hover:-translate-y-1 hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-200 animate-fade-in-up stagger-${(i % 6) + 1}`}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${g} text-white text-base font-extrabold shadow-md mb-2.5`}>
                    {deck.title.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{deck.title}</div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                    {t('decks.cardsCount', { count: deck.cards_count })}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Admin shortcuts */}
      {isAdmin && (
        <section className="space-y-4 animate-fade-in-up stagger-6">
          <SectionHeading
            color="lives"
            label={t('dashboard.adminShortcuts')}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
          />
          <AdminStats />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminShortcut
              to="/admin?tab=languages"
              label={t('admin.tab.languages')}
              gradient="from-success-500 to-success-600"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
              gradient="from-primary-500 to-primary-600"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              }
              delayClass="stagger-2"
            />
            <AdminShortcut
              to="/admin?tab=stories"
              label={t('admin.tab.stories')}
              gradient="from-xp-400 to-streak-500"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              }
              delayClass="stagger-3"
            />
            <AdminShortcut
              to="/admin?tab=users"
              label={t('admin.tab.users')}
              gradient="from-sky-500 to-primary-600"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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

// ===== Helper components =====

function SectionHeading({
  label,
  icon,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'lives' | 'xp';
}) {
  const bg: Record<string, string> = {
    primary: 'from-primary-500 to-primary-600 shadow-primary-500/30',
    success: 'from-success-500 to-success-600 shadow-success-500/30',
    lives: 'from-lives-500 to-lives-600 shadow-lives-500/30',
    xp: 'from-xp-400 to-xp-500 shadow-xp-500/30',
  };
  return (
    <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
      <span
        className={`inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br ${bg[color]} text-white shadow-md`}
      >
        {icon}
      </span>
      {label}
    </h2>
  );
}

function HeroStat({
  kind,
  value,
  label,
  loading,
}: {
  kind: 'streak' | 'xp';
  value: number;
  label: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="w-12 h-12 rounded-2xl skeleton-shimmer" />
        <div className="mt-3 h-7 w-16 rounded skeleton-shimmer" />
        <div className="mt-2 h-3 w-20 rounded skeleton-shimmer" />
      </div>
    );
  }
  const isStreak = kind === 'streak';
  return (
    <div className="card p-5 flex items-center gap-4">
      <div
        className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${
          isStreak
            ? 'bg-streak-50 dark:bg-streak-500/15 text-streak-500'
            : 'bg-xp-50 dark:bg-xp-500/15 text-xp-500'
        }`}
      >
        {isStreak ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className={value > 0 ? 'animate-flame-flicker' : ''}>
            <path d="M12 2s2 3 2 5.5c0 1.5-.7 2.5-1.7 3.5C13.3 12 14 11 14 9c1 1 3 3.5 3 7 0 3.31-2.69 6-6 6s-6-2.69-6-6c0-3.6 3-7 3-7 0 2 .7 3 1.7 4-1-1-1.7-2-1.7-3.5C8 4 12 2 12 2z" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2 4 9l8 13 8-13-8-7zm0 2.8L17.5 9h-3.3L12 4.8zm-2.2 4.2L12 4.8 9.8 9zM6.5 9h3.2L12 19l-5.5-10zm11 0L12 19l5.5-10z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
          {value.toLocaleString()}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
          {label}
        </div>
      </div>
    </div>
  );
}

function HeroGoal({
  xp,
  goal,
  label,
  dueCount,
}: {
  xp: number;
  goal: number;
  label: string;
  dueCount: number;
}) {
  const pct = Math.min(100, Math.round((xp / goal) * 100));
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg width="56" height="56" className="-rotate-90">
          <circle cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-200 dark:text-slate-800" />
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="text-success-500 transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-slate-700 dark:text-slate-200">
          {pct}%
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {dueCount}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
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
    <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 p-7 text-center">
      <p className="text-sm font-bold text-slate-500 mb-3">{text}</p>
      {cta && (
        <Link
          to={ctaLink}
          className="inline-flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400 hover:underline"
        >
          {cta} →
        </Link>
      )}
    </div>
  );
}

function VocabStat({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'lives' | 'xp';
  loading?: boolean;
}) {
  const bg: Record<string, string> = {
    primary: 'from-primary-500 to-primary-600 shadow-primary-500/25',
    success: 'from-success-500 to-success-600 shadow-success-500/25',
    lives: 'from-lives-500 to-lives-600 shadow-lives-500/25',
    xp: 'from-xp-400 to-xp-500 shadow-xp-500/25',
  };
  if (loading) {
    return (
      <div className="card p-4">
        <div className="w-10 h-10 rounded-xl skeleton-shimmer mb-3" />
        <div className="h-6 w-14 rounded skeleton-shimmer mb-1.5" />
        <div className="h-3 w-20 rounded skeleton-shimmer" />
      </div>
    );
  }
  return (
    <div className="card p-4">
      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${bg[color]} text-white shadow-md mb-3`}>
        {icon}
      </span>
      <div className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">{value.toLocaleString()}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
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
      className={`group card p-4 hover:-translate-y-1 hover:border-primary-400 dark:hover:border-primary-500 transition-all animate-fade-in-up ${delayClass}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
            {label}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest font-bold flex items-center gap-1">
            <span>open</span>
            <svg className="group-hover:translate-x-1 transition-transform" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
