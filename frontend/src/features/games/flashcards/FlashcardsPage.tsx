import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { gamesApi } from '@/api/games';
import { progressApi } from '@/api/progress';
import { GameBreadcrumb, useLessonContext } from '../GameBreadcrumb';
import { useSessionStore } from '@/store/sessionStore';
import type { FlashcardItem } from '@/types';

export function FlashcardsPage() {
  const { id } = useParams();
  const deckId = Number(id);
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['game-flashcards', deckId],
    queryFn: () => gamesApi.start('flashcards', deckId, 200),
    enabled: !!deckId,
  });

  const items = (data?.items ?? []) as FlashcardItem[];
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useState(() => Date.now())[0];
  const setSessionActive = useSessionStore((s) => s.setSessionActive);

  useEffect(() => {
    setSessionActive(!done);
    return () => setSessionActive(false);
  }, [done, setSessionActive]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done || !items.length) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        rate(5);
      } else if (e.code === 'ArrowLeft') {
        rate(2);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const rate = async (quality: number) => {
    const card = items[idx];
    if (!card) return;
    if (quality >= 3) setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);
    progressApi.review({ card_id: card.card_id, quality }).catch(() => {});
    setFlipped(false);
    if (idx + 1 >= items.length) {
      setDone(true);
      const duration = Math.round((Date.now() - startedAt) / 1000);
      gamesApi
        .saveSession({
          deck_id: deckId,
          game_type: 'flashcards',
          score: correct + (quality >= 3 ? 1 : 0),
          correct: correct + (quality >= 3 ? 1 : 0),
          incorrect: incorrect + (quality < 3 ? 1 : 0),
          duration_seconds: duration,
        })
        .catch(() => {});
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (isLoading) return <LoadingShell />;
  if (!items.length)
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-12 text-center max-w-md mx-auto">
        <p className="text-slate-500">{t('decks.empty')}</p>
      </div>
    );

  if (done) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <GameBreadcrumb gameKey="flashcards" isGameActive={false} />
        <ResultScreen
          deckId={deckId}
          correct={correct}
          incorrect={incorrect}
          total={items.length}
        />
      </div>
    );
  }

  const current = items[idx];
  const progressPct = Math.round((idx / items.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <GameBreadcrumb gameKey="flashcards" isGameActive={!done} />

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {incorrect}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Flip card */}
      <div
        className="relative h-[280px] sm:h-[340px] [perspective:1500px] cursor-pointer select-none animate-fade-in-up"
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className={`absolute inset-0 [transform-style:preserve-3d] transition-transform duration-700 ${
            flipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-2xl shadow-emerald-500/30 p-8 flex items-center justify-center overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-3">
                {t('games.flashcards')}
              </div>
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight break-words">
                {current.term}
              </div>
              {current.transcription && (
                <div className="mt-2 text-sm sm:text-base text-white/85 italic">
                  {current.transcription}
                </div>
              )}
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
                {t('games.tapToFlip')}
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-3xl bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 text-white shadow-2xl shadow-violet-500/30 p-8 flex items-center justify-center overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-3">
                {current.term}
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold tracking-tight break-words">
                {current.definition}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => rate(2)}
          className="group inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25 hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t('games.iDontKnow')}
        </button>
        <button
          onClick={() => rate(5)}
          className="group inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          {t('games.iKnow')}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      <div className="text-center text-xs text-slate-400">
        {t('games.keyboardHints')}
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="h-6 rounded skeleton-shimmer w-32" />
      <div className="h-2 rounded-full skeleton-shimmer" />
      <div className="h-72 rounded-3xl skeleton-shimmer" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 rounded-2xl skeleton-shimmer" />
        <div className="h-14 rounded-2xl skeleton-shimmer" />
      </div>
    </div>
  );
}

function ResultScreen({
  deckId,
  correct,
  incorrect,
  total,
}: {
  deckId: number;
  correct: number;
  incorrect: number;
  total: number;
}) {
  const { t } = useTranslation();
  const lessonCtx = useLessonContext();
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = percent >= 70;
  return (
    <div className="animate-fade-in-up">
      <div
        className={`relative overflow-hidden rounded-3xl text-white p-8 sm:p-10 text-center bg-gradient-to-br ${
          passed
            ? 'from-emerald-500 via-teal-500 to-cyan-600'
            : 'from-amber-500 via-orange-500 to-rose-500'
        }`}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/20 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/15 blur-3xl animate-float-slow" style={{ animationDelay: '3s' }} />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl mb-4 animate-scale-in">
            <span className="text-4xl font-extrabold tabular-nums">{percent}%</span>
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
              <span className="w-2 h-2 rounded-full bg-rose-300" />
              {incorrect}
            </span>
          </div>
          <div className="mt-6 flex justify-center gap-2 flex-wrap">
            <Link
              to={lessonCtx.replayPath(deckId, 'flashcards')}
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
