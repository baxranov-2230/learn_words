import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { gamesApi } from '@/api/games';
import { lessonsApi } from '@/api/lessons';
import { progressApi } from '@/api/progress';
import { GameBreadcrumb, useLessonContext } from '../GameBreadcrumb';
import { useSessionStore } from '@/store/sessionStore';
import type { LessonAttemptResult, TestQuestion } from '@/types';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const OPTION_COLORS = [
  'from-primary-500 to-primary-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-lives-500 to-pink-600',
  'from-sky-500 to-blue-600',
  'from-sky-500 to-purple-600',
];

export function TestGamePage() {
  const { id } = useParams();
  const deckId = Number(id);
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson')
    ? Number(searchParams.get('lesson'))
    : null;
  const lessonCtx = useLessonContext();

  const { data, isLoading } = useQuery({
    queryKey: ['game-test', deckId],
    queryFn: () => gamesApi.start('test', deckId, 200),
    enabled: !!deckId,
  });
  const questions = (data?.items ?? []) as TestQuestion[];
  const queryClient = useQueryClient();

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [lessonResult, setLessonResult] = useState<LessonAttemptResult | null>(
    null,
  );
  const startedAt = useState(() => Date.now())[0];
  const setSessionActive = useSessionStore((s) => s.setSessionActive);

  useEffect(() => {
    setSessionActive(!done);
    return () => setSessionActive(false);
  }, [done, setSessionActive]);

  if (isLoading) return <LoadingState />;
  if (!questions.length) return <EmptyState />;

  if (done) {
    const total = questions.length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = lessonResult?.passed ?? percent >= 70;
    return (
      <div className="max-w-lg mx-auto animate-fade-in-up">
        <div
          className={`relative overflow-hidden rounded-3xl text-white p-8 sm:p-10 text-center bg-gradient-to-br ${
            passed
              ? 'from-emerald-500 via-teal-500 to-cyan-600'
              : 'from-lives-500 via-pink-500 to-sky-500'
          }`}
        >
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/20 blur-3xl animate-float-slow" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/15 blur-3xl animate-float-slow" style={{ animationDelay: '3s' }} />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl mb-4 animate-scale-in">
              {passed ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="text-4xl font-extrabold tabular-nums">{percent}%</span>
              )}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {passed ? t('games.greatJob') : t('games.tryHarder')}
            </h2>
            <div className="mt-3 text-2xl font-bold tabular-nums">
              {percent}<span className="text-lg text-white/80">%</span>
            </div>
            <div className="mt-4 inline-flex items-center gap-4 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                {correct}
              </span>
              <span className="text-white/40">|</span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-lives-300" />
                {incorrect}
              </span>
            </div>
            {lessonResult && (
              <div className="mt-5 px-4 py-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-sm">
                <div className="text-white/80">
                  {t('courses.bestScore')}:{' '}
                  <span className="font-bold tabular-nums">
                    {lessonResult.best_score}%
                  </span>
                </div>
                {lessonResult.just_passed && lessonResult.next_lesson_id && (
                  <div className="font-bold mt-1.5 text-base">
                    🎉 {t('courses.nextUnlocked')}
                  </div>
                )}
              </div>
            )}
            <div className="mt-6 flex justify-center gap-2 flex-wrap">
              <Link
                to={lessonCtx.replayPath(deckId, 'test')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-bold hover:bg-white/30 transition-all hover:scale-105"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
                {t('games.playAgain')}
              </Link>
              {lessonCtx.backToLessonPath && (
                <Link
                  to={lessonCtx.backToLessonPath}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm font-bold hover:bg-white/20 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  {t('lesson.backToLesson')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[idx];

  const pickOption = (opt: string) => {
    if (revealed) return;
    setPicked(opt);
    setRevealed(true);
    const isCorrect = opt === q.definition;
    if (isCorrect) setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);
    progressApi
      .review({ card_id: q.card_id, quality: isCorrect ? 5 : 2, source: 'test' })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['progress', 'weak'] });
        queryClient.invalidateQueries({ queryKey: ['progress', 'me'] });
      })
      .catch(() => {});

    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        setDone(true);
        const finalCorrect = correct + (isCorrect ? 1 : 0);
        const finalIncorrect = incorrect + (isCorrect ? 0 : 1);
        const duration = Math.round((Date.now() - startedAt) / 1000);
        gamesApi
          .saveSession({
            deck_id: deckId,
            game_type: 'test',
            score: finalCorrect,
            correct: finalCorrect,
            incorrect: finalIncorrect,
            duration_seconds: duration,
          })
          .catch(() => {});
        if (lessonId) {
          const total = questions.length;
          const percent = total > 0 ? Math.round((finalCorrect / total) * 100) : 0;
          lessonsApi
            .attempt(lessonId, percent)
            .then((res) => setLessonResult(res))
            .catch(() => {});
        }
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
        setRevealed(false);
      }
    }, 1100);
  };

  const progressPct = Math.round(((idx + (revealed ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <GameBreadcrumb gameKey="test" isGameActive={!done} />

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 animate-fade-in-up">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {idx + 1} / {questions.length}
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {correct}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lives-100 text-lives-700 dark:bg-lives-500/15 dark:text-lives-300">
            <span className="w-1.5 h-1.5 rounded-full bg-lives-500" />
            {incorrect}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 via-primary-500 to-sky-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question */}
      <div
        key={idx}
        className="animate-fade-in-up rounded-3xl bg-gradient-to-br from-primary-500 via-primary-500 to-sky-500 text-white p-8 sm:p-10 text-center shadow-xl shadow-primary-500/20 relative overflow-hidden"
      >
        <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
        <div className="relative">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-3">
            {t('games.translateQuestion')}
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight break-words">
            {q.term}
          </h2>
        </div>
      </div>

      {/* Options */}
      <div className="grid gap-2.5 sm:gap-3">
        {q.options.map((opt, i) => {
          const isPicked = picked === opt;
          const isCorrect = revealed && opt === q.definition;
          const isWrong = revealed && isPicked && opt !== q.definition;
          return (
            <button
              key={opt}
              onClick={() => pickOption(opt)}
              disabled={revealed}
              className={`group relative overflow-hidden flex items-center gap-3 p-3 sm:p-4 rounded-2xl text-left text-base font-semibold border-2 transition-all duration-300 animate-fade-in-up stagger-${(i % 6) + 1} ${
                isCorrect
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 scale-[1.02]'
                  : isWrong
                  ? 'border-lives-500 bg-lives-50 dark:bg-lives-500/15 text-lives-900 dark:text-lives-100'
                  : isPicked
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/15'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-500/50 hover:-translate-y-0.5 hover:shadow-md'
              } ${revealed ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-white text-sm font-extrabold flex-shrink-0 transition-all bg-gradient-to-br ${
                  isCorrect
                    ? 'from-emerald-500 to-teal-600'
                    : isWrong
                    ? 'from-lives-500 to-pink-600'
                    : OPTION_COLORS[i % OPTION_COLORS.length]
                } shadow-md`}
              >
                {isCorrect ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isWrong ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  OPTION_LETTERS[i] ?? i + 1
                )}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="h-6 rounded skeleton-shimmer w-32" />
      <div className="h-2 rounded-full skeleton-shimmer" />
      <div className="h-40 rounded-3xl skeleton-shimmer" />
      <div className="h-14 rounded-2xl skeleton-shimmer" />
      <div className="h-14 rounded-2xl skeleton-shimmer" />
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-12 text-center max-w-md mx-auto">
      <p className="text-slate-500">{t('decks.empty')}</p>
    </div>
  );
}
