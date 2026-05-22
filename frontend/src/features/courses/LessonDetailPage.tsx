import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '@/api/courses';
import { lessonsApi } from '@/api/lessons';
import { cardsApi } from '@/api/decks';
import { storiesApi } from '@/api/stories';
import { courseGradient } from './courseGradient';
import type { LessonStatus } from '@/types';

type LessonState = 'locked' | 'pending' | 'inprogress' | 'passed';

function lessonState(l: LessonStatus): LessonState {
  if (l.passed) return 'passed';
  if (l.locked) return 'locked';
  if (l.attempts > 0) return 'inprogress';
  return 'pending';
}

const STATE_BG: Record<LessonState, string> = {
  locked: 'from-lives-500 to-lives-600',
  pending: 'from-primary-500 to-primary-600',
  inprogress: 'from-streak-500 to-streak-600',
  passed: 'from-success-500 to-success-600',
};

const GAMES: Array<{
  key: 'flashcards' | 'test' | 'match' | 'spelling' | 'scramble';
  labelKey: string;
  descKey: string;
  gradient: string;
  primary?: boolean;
  icon: React.ReactNode;
}> = [
  {
    key: 'test',
    labelKey: 'games.test',
    descKey: 'lesson.gameTestDesc',
    gradient: 'from-primary-500 to-primary-600',
    primary: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    key: 'match',
    labelKey: 'games.match',
    descKey: 'lesson.gameMatchDesc',
    gradient: 'from-success-500 to-success-600',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'spelling',
    labelKey: 'games.spelling',
    descKey: 'lesson.gameSpellingDesc',
    gradient: 'from-sky-500 to-primary-600',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    key: 'scramble',
    labelKey: 'games.scramble',
    descKey: 'lesson.gameScrambleDesc',
    gradient: 'from-streak-500 to-lives-500',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="5" rx="1" />
        <rect x="3" y="16" width="5" height="5" rx="1" />
        <rect x="16" y="3" width="5" height="5" rx="1" />
        <rect x="16" y="16" width="5" height="5" rx="1" />
        <path d="M8 5.5h8M8 18.5h8M5.5 8v8M18.5 8v8" strokeDasharray="2 2" />
      </svg>
    ),
  },
];

export function LessonDetailPage() {
  const { courseId, lessonId } = useParams();
  const cId = Number(courseId);
  const lId = Number(lessonId);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: course } = useQuery({
    queryKey: ['course', cId],
    queryFn: () => coursesApi.get(cId),
    enabled: !!cId,
  });
  const { data: lessons } = useQuery({
    queryKey: ['course-lessons', cId],
    queryFn: () => lessonsApi.list(cId),
    enabled: !!cId,
  });

  const lesson = useMemo(
    () => lessons?.find((l) => l.id === lId) ?? null,
    [lessons, lId],
  );

  const { data: cards } = useQuery({
    queryKey: ['cards', lesson?.deck_id],
    queryFn: () => cardsApi.list(lesson!.deck_id!),
    enabled: !!lesson?.deck_id,
  });

  const { data: story } = useQuery({
    queryKey: ['story', lesson?.story_id],
    queryFn: () => storiesApi.get(lesson!.story_id!),
    enabled: !!lesson?.story_id,
  });

  if (!lesson || !course) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-2xl skeleton-shimmer" />
        <div className="h-32 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (lesson.locked) {
    return (
      <div className="card border-lives-200 dark:border-lives-500/30 p-8 sm:p-12 text-center max-w-2xl mx-auto animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-lives-500 to-lives-600 text-white shadow-lg shadow-lives-500/30 mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('lesson.lockedTitle')}</h2>
        <p className="text-slate-500 mb-6">{t('lesson.lockedHint')}</p>
        <Link to={`/courses/${cId}`} className="btn-primary">
          {t('lesson.backToCourse')}
        </Link>
      </div>
    );
  }

  const state = lessonState(lesson);
  const stateGradient = STATE_BG[state];
  const courseGrad = courseGradient(course.cover_color, course.title);
  const score = lesson.best_score;
  const target = lesson.passing_score;
  const fillPct = Math.min(100, Math.round((score / Math.max(1, target)) * 100));

  const playGame = (mode: string) => {
    if (!lesson.deck_id) return;
    navigate(
      `/decks/${lesson.deck_id}/play/${mode}?lesson=${lesson.id}&course=${cId}`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br ${courseGrad} p-6 sm:p-8 text-white animate-fade-in-up`}
      >
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/15 blur-3xl animate-float-slow" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/courses/${cId}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium hover:bg-white/25 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {course.title}
            </Link>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/25 backdrop-blur-sm uppercase tracking-widest">
              {t('courses.lessonNum', { n: (lesson.position ?? 0) + 1 })}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-full bg-gradient-to-r ${stateGradient} shadow-md`}
            >
              {t(`courses.state.${state}`)}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {lesson.title}
          </h1>

          {/* Progress bar */}
          {lesson.attempts > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-end justify-between gap-3">
                <div className="text-xs uppercase tracking-widest font-semibold text-white/85">
                  {t('lesson.scoreLabel')}
                </div>
                <div className="text-xs text-white/85">
                  {score}% / {target}% {t('lesson.scoreTarget')}
                </div>
              </div>
              <div className="h-3 rounded-full bg-white/15 backdrop-blur-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 transition-all duration-700"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <div className="text-xs text-white/75">
                {t('courses.attemptsCount', { n: lesson.attempts })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Steps tip */}
      <div className="rounded-3xl bg-primary-50 dark:bg-primary-500/10 border-2 border-primary-200 dark:border-primary-500/30 p-4 flex items-start gap-3 animate-fade-in-up stagger-1">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </span>
        <div className="text-sm">
          <div className="font-extrabold mb-0.5 text-slate-900 dark:text-slate-100">
            {t('lesson.flowTitle')}
          </div>
          <div className="font-semibold text-slate-600 dark:text-slate-300">
            {t('lesson.flowHint')}
          </div>
        </div>
      </div>

      {/* Step 1: Words */}
      {lesson.deck_id && (
        <Step
          number={1}
          title={t('lesson.stepWords')}
          subtitle={t('lesson.stepWordsHint')}
          gradient="from-success-500 to-success-600"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7l10-5 10 5-10 5L2 7z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          }
        >
          <WordsGrid cards={cards ?? []} />
          {!!cards?.length && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => playGame('flashcards')}
                className="btn-primary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {t('lesson.openFlashcards')}
              </button>
              <span className="text-xs text-slate-500 self-center">
                {t('lesson.wordsCount', { n: cards.length })}
              </span>
            </div>
          )}
        </Step>
      )}

      {/* Step 2: Story */}
      {lesson.story_id && (
        <Step
          number={lesson.deck_id ? 2 : 1}
          title={t('lesson.stepStory')}
          subtitle={t('lesson.stepStoryHint')}
          gradient="from-primary-500 to-sky-500"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        >
          {story ? (
            <StoryPreview
              storyId={story.id}
              lessonId={lId}
              courseId={cId}
              title={story.title}
              content={story.content}
            />
          ) : (
            <p className="text-sm text-slate-500">{t('common.loading')}</p>
          )}
        </Step>
      )}

      {/* Step 3: Games */}
      {lesson.deck_id && (
        <Step
          number={lesson.deck_id && lesson.story_id ? 3 : lesson.deck_id ? 2 : 1}
          title={t('lesson.stepGames')}
          subtitle={t('lesson.stepGamesHint')}
          gradient="from-primary-500 to-sky-500"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="11" x2="10" y2="11" />
              <line x1="8" y1="9" x2="8" y2="13" />
              <circle cx="15" cy="12" r="0.5" fill="currentColor" />
              <circle cx="18" cy="10" r="0.5" fill="currentColor" />
              <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z" />
            </svg>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {GAMES.map((g, i) => (
              <button
                key={g.key}
                onClick={() => playGame(g.key)}
                className={`group relative overflow-hidden text-left rounded-2xl bg-white dark:bg-slate-800 border-2 ${
                  g.primary
                    ? 'border-primary-300 dark:border-primary-500/40 shadow-md shadow-primary-500/10'
                    : 'border-slate-200 dark:border-slate-700'
                } p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all animate-fade-in-up stagger-${(i % 6) + 1}`}
              >
                {g.primary && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm">
                    {t('lesson.scoresLesson')}
                  </span>
                )}
                <div
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${g.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  {g.icon}
                </div>
                <div className="mt-3 font-bold">{t(g.labelKey)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t(g.descKey)}
                </div>
              </button>
            ))}
          </div>
        </Step>
      )}

      {/* Step 4: Exam */}
      {(lesson.story_id || lesson.deck_id) && (
        <Step
          number={(lesson.deck_id ? 1 : 0) + (lesson.story_id ? 1 : 0) + (lesson.deck_id ? 1 : 0) + 1}
          title={t('lesson.stepQuiz', 'Imtihon')}
          subtitle={t('lesson.stepQuizHint', "Bilimingizni sinab ko'ring va darsni yakunlang")}
          gradient="from-primary-600 to-primary-700"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        >
          <div className="flex flex-col items-center text-center max-w-sm mx-auto">
            <p className="text-sm text-slate-500 mb-6">
              {lesson.story_id 
                ? t('lesson.quizStoryDesc', "Hikoya mazmuni va so'zlar bo'yicha imtihon topshiring.")
                : t('lesson.quizDeckDesc', "Ushbu darsdagi barcha so'zlarni qanchalik yodlaganingizni tekshiring.")
              }
            </p>
            <button
              onClick={() => {
                if (lesson.story_id) {
                  navigate(`/stories/${lesson.story_id}/quiz?lesson=${lesson.id}&course=${cId}`);
                } else {
                  playGame('test');
                }
              }}
              className="btn-3d-primary btn-3d-lg"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {t('reader.startQuiz', "Imtihonni boshlash")}
            </button>
            {lesson.attempts > 0 && (
              <div className={`mt-4 px-4 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider ${lesson.passed ? 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-400' : 'bg-lives-100 text-lives-700 dark:bg-lives-500/15 dark:text-lives-400'}`}>
                {lesson.passed ? t('courses.state.passed') : t('courses.tryAgain')}
              </div>
            )}
          </div>
        </Step>
      )}
    </div>
  );
}

function Step({
  number,
  title,
  subtitle,
  gradient,
  icon,
  children,
}: {
  number: number;
  title: string;
  subtitle: string;
  gradient: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`card overflow-hidden p-0 animate-fade-in-up stagger-${(number % 6) + 1}`}
    >
      <div className="px-5 py-4 border-b-2 border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <span
          className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md`}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {number}-bosqich
            </span>
          </div>
          <h2 className="font-extrabold text-base sm:text-lg leading-tight text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function WordsGrid({
  cards,
}: {
  cards: Array<{
    id: number;
    term: string;
    definition: string;
    transcription?: string | null;
    example?: string | null;
  }>;
}) {
  const { t } = useTranslation();
  const [flippedAll, setFlippedAll] = useState(false);

  if (cards.length === 0) {
    return <p className="text-sm text-slate-500">{t('lesson.emptyWords')}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs text-slate-500">{t('lesson.tapCardHint')}</p>
        <button
          onClick={() => setFlippedAll((v) => !v)}
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          {flippedAll ? t('lesson.hideAll') : t('lesson.revealAll')}
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <WordCard key={c.id} card={c} index={i} forceFlipped={flippedAll} />
        ))}
      </div>
    </div>
  );
}

function WordCard({
  card,
  index,
  forceFlipped,
}: {
  card: {
    id: number;
    term: string;
    definition: string;
    transcription?: string | null;
    example?: string | null;
  };
  index: number;
  forceFlipped: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const isFlipped = forceFlipped || flipped;

  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      className={`group relative h-24 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-success-400 dark:hover:border-success-500 transition-all duration-200 hover:-translate-y-0.5 text-left overflow-hidden animate-fade-in-up stagger-${(index % 6) + 1}`}
    >
      <span className="absolute top-2 right-2 text-[10px] font-bold text-slate-300 dark:text-slate-600 tabular-nums">
        {index + 1}
      </span>
      <div className="p-3 h-full flex flex-col justify-center">
        {!isFlipped ? (
          <>
            <div className="font-bold text-base truncate">{card.term}</div>
            {card.transcription && (
              <div className="text-xs text-slate-400 mt-0.5">
                {card.transcription}
              </div>
            )}
            <div className="absolute bottom-2 left-3 text-[10px] text-slate-400">
              ↻
            </div>
          </>
        ) : (
          <div className="animate-fade-in">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              {card.term}
            </div>
            <div className="font-extrabold text-sm text-success-700 dark:text-success-400 mt-0.5 line-clamp-2">
              {card.definition}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

function StoryPreview({
  storyId,
  lessonId,
  courseId,
  title,
  content,
}: {
  storyId: number;
  lessonId: number;
  courseId: number;
  title: string;
  content: string;
}) {
  const { t } = useTranslation();
  const preview = content.length > 220 ? content.slice(0, 220) + '…' : content;
  return (
    <div className="rounded-2xl border-2 border-primary-200 dark:border-primary-500/30 bg-primary-50 dark:bg-primary-500/10 p-5">
      <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
        {preview}
      </p>
      <Link
        to={`/stories/${storyId}?lesson=${lessonId}&course=${courseId}`}
        className="inline-flex items-center gap-1.5 mt-4 text-sm font-extrabold uppercase tracking-wider text-primary-700 dark:text-primary-400 hover:underline"
      >
        {t('lesson.readStory')}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

