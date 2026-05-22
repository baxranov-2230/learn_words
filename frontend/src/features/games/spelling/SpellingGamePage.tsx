import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { gamesApi } from '@/api/games';
import { progressApi } from '@/api/progress';
import { GameBreadcrumb, useLessonContext } from '../GameBreadcrumb';
import { useSessionStore } from '@/store/sessionStore';
import type { FlashcardItem } from '@/types';

export function SpellingGamePage() {
  const { id } = useParams();
  const deckId = Number(id);
  const { t } = useTranslation();
  const lessonCtx = useLessonContext();

  const { data, isLoading } = useQuery({
    queryKey: ['game-spelling', deckId],
    queryFn: () => gamesApi.start('spelling', deckId, 200),
    enabled: !!deckId,
  });
  const items = (data?.items ?? []) as FlashcardItem[];

  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useState(() => Date.now())[0];
  const setSessionActive = useSessionStore((s) => s.setSessionActive);

  useEffect(() => {
    setSessionActive(!done);
    return () => setSessionActive(false);
  }, [done, setSessionActive]);

  if (isLoading) return <LoadingShell />;
  if (!items.length)
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-12 text-center max-w-md mx-auto">
        <p className="text-slate-500">{t('decks.empty')}</p>
      </div>
    );

  if (done) {
    const percent =
      items.length > 0 ? Math.round((correct / items.length) * 100) : 0;
    const passed = percent >= 70;
    return (
      <div className="max-w-lg mx-auto animate-fade-in-up">
        <div
          className={`relative overflow-hidden rounded-3xl text-white p-8 sm:p-10 text-center bg-gradient-to-br ${
            passed
              ? 'from-amber-500 via-orange-500 to-red-500'
              : 'from-lives-500 via-pink-500 to-sky-500'
          }`}
        >
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/20 blur-3xl animate-float-slow" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl mb-4 animate-scale-in">
              <span className="text-4xl font-extrabold tabular-nums">
                {percent}%
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {t('games.result')}
            </h2>
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
            <div className="mt-6 flex justify-center gap-2 flex-wrap">
              <Link
                to={lessonCtx.replayPath(deckId, 'spelling')}
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

  const current = items[idx];
  const progressPct = Math.round((idx / items.length) * 100);

  const submit = () => {
    const isCorrect =
      answer.trim().toLowerCase() === current.definition.trim().toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);
    progressApi
      .review({ card_id: current.card_id, quality: isCorrect ? 5 : 1 })
      .catch(() => {});

    setTimeout(
      () => {
        setFeedback(null);
        setAnswer('');
        if (idx + 1 >= items.length) {
          setDone(true);
          const duration = Math.round((Date.now() - startedAt) / 1000);
          gamesApi
            .saveSession({
              deck_id: deckId,
              game_type: 'spelling',
              score: correct + (isCorrect ? 1 : 0),
              correct: correct + (isCorrect ? 1 : 0),
              incorrect: incorrect + (isCorrect ? 0 : 1),
              duration_seconds: duration,
            })
            .catch(() => {});
        } else {
          setIdx((i) => i + 1);
        }
      },
      isCorrect ? 700 : 1500,
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <GameBreadcrumb gameKey="spelling" isGameActive={!done} />

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 animate-fade-in-up">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {idx + 1} / {items.length}
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

      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Term card */}
      <div
        key={idx}
        className="animate-fade-in-up rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white p-8 sm:p-10 text-center shadow-xl shadow-orange-500/20 relative overflow-hidden"
      >
        <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
        <div className="relative">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/85 mb-3">
            {t('games.spellQuestion')}
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight break-words">
            {current.term}
          </h2>
          {current.transcription && (
            <div className="mt-2 text-sm sm:text-base text-white/85 italic">
              {current.transcription}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div
        className={`relative rounded-2xl bg-white dark:bg-slate-800 border-2 transition-all duration-300 ${
          feedback === 'correct'
            ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
            : feedback === 'wrong'
            ? 'border-lives-500 shadow-lg shadow-lives-500/20'
            : 'border-slate-200 dark:border-slate-700 focus-within:border-amber-500 focus-within:shadow-lg focus-within:shadow-amber-500/15'
        }`}
      >
        <input
          autoFocus
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && answer && submit()}
          placeholder={t('games.typeAnswer')}
          className="w-full px-5 py-4 sm:py-5 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-2xl placeholder:text-slate-400"
          disabled={feedback !== null}
        />
        {feedback === 'correct' && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-white animate-scale-in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {feedback === 'wrong' && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-lives-500 text-white animate-scale-in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>
        )}
      </div>

      {feedback === 'wrong' && (
        <div className="rounded-xl bg-lives-50 dark:bg-lives-500/10 border border-lives-200 dark:border-lives-500/30 p-3 text-sm animate-fade-in">
          <span className="text-lives-700 dark:text-lives-300 font-semibold">
            {t('games.correct')}:{' '}
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {current.definition}
          </span>
        </div>
      )}

      <button
        onClick={submit}
        disabled={!answer || feedback !== null}
        className="btn-primary w-full justify-center text-base py-3"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
        {t('games.next')}
      </button>

      <div className="text-center text-xs text-slate-400">
        {t('games.enterHint')}
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="h-6 rounded skeleton-shimmer w-32" />
      <div className="h-2 rounded-full skeleton-shimmer" />
      <div className="h-44 rounded-3xl skeleton-shimmer" />
      <div className="h-16 rounded-2xl skeleton-shimmer" />
    </div>
  );
}
