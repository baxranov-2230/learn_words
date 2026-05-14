import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { gamesApi } from '@/api/games';
import { useSessionStore } from '@/store/sessionStore';
import { GameBreadcrumb, useLessonContext } from '../GameBreadcrumb';
import type { FlashcardItem } from '@/types';

interface FallingWord {
  id: number;
  cardId: number;
  term: string;
  answer: string;
  x: number; // %
  y: number; // %
  color: number;
}

const PILL_COLORS = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
];

export function GravityGamePage() {
  const { id } = useParams();
  const deckId = Number(id);
  const { t } = useTranslation();
  const lessonCtx = useLessonContext();

  const { data, isLoading } = useQuery({
    queryKey: ['game-gravity', deckId],
    queryFn: () => gamesApi.start('gravity', deckId, 30),
    enabled: !!deckId,
  });
  const items = (data?.items ?? []) as FlashcardItem[];

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [active, setActive] = useState<FallingWord[]>([]);
  const [answer, setAnswer] = useState('');
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | null>(null);
  const counterRef = useRef(0);
  const spawnTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const startedAt = useRef(Date.now());
  const speed = 0.4; // % per tick

  const setSessionActive = useSessionStore((s) => s.setSessionActive);

  useEffect(() => {
    setSessionActive(!done);
    return () => setSessionActive(false);
  }, [done, setSessionActive]);

  useEffect(() => {
    if (!items.length || done) return;

    const spawn = () => {
      const c = items[counterRef.current % items.length];
      counterRef.current += 1;
      setActive((arr) => [
        ...arr,
        {
          id: counterRef.current,
          cardId: c.card_id,
          term: c.term,
          answer: c.definition,
          x: 5 + Math.random() * 80,
          y: 0,
          color: counterRef.current % PILL_COLORS.length,
        },
      ]);
    };

    spawn();
    spawnTimerRef.current = window.setInterval(spawn, 3500);
    tickTimerRef.current = window.setInterval(() => {
      setActive((arr) => {
        const moved = arr.map((w) => ({ ...w, y: w.y + speed }));
        const fallen = moved.filter((w) => w.y >= 100);
        if (fallen.length) {
          setLives((l) => l - fallen.length);
        }
        return moved.filter((w) => w.y < 100);
      });
    }, 50);

    return () => {
      if (spawnTimerRef.current) window.clearInterval(spawnTimerRef.current);
      if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
    };
  }, [items.length, done]);

  useEffect(() => {
    if (lives <= 0 && !done) {
      setDone(true);
      const duration = Math.round((Date.now() - startedAt.current) / 1000);
      gamesApi
        .saveSession({
          deck_id: deckId,
          game_type: 'gravity',
          score,
          correct: score,
          incorrect: 3,
          duration_seconds: duration,
        })
        .catch(() => {});
    }
  }, [lives, done, deckId, score]);

  const submit = () => {
    const a = answer.trim().toLowerCase();
    if (!a) return;
    let hit = false;
    setActive((arr) => {
      const idx = arr.findIndex((w) => w.answer.trim().toLowerCase() === a);
      if (idx >= 0) {
        hit = true;
        return arr.filter((_, i) => i !== idx);
      }
      return arr;
    });
    if (hit) {
      setScore((s) => s + 10);
      setFeedback('hit');
    } else {
      setFeedback('miss');
    }
    setTimeout(() => setFeedback(null), 350);
    setAnswer('');
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
      <div className="max-w-lg mx-auto animate-fade-in-up">
        <div className="relative overflow-hidden rounded-3xl text-white p-8 sm:p-10 text-center bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600">
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/20 blur-3xl animate-float-slow" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl mb-4 animate-scale-in">
              <span className="text-4xl font-extrabold tabular-nums">{score}</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {t('games.result')}
            </h2>
            <div className="mt-3 text-base text-white/85">
              {t('games.score')}
            </div>
            <div className="mt-6 flex justify-center gap-2 flex-wrap">
              <Link
                to={lessonCtx.replayPath(deckId, 'gravity')}
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

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <GameBreadcrumb gameKey="gravity" isGameActive={!done} />

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-md tabular-nums">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69z" />
          </svg>
          {score}
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`text-2xl transition-all duration-300 ${
                i < lives
                  ? 'text-rose-500 drop-shadow-md'
                  : 'text-slate-300 dark:text-slate-700 grayscale'
              }`}
            >
              ♥
            </span>
          ))}
        </div>
      </div>

      {/* Game area */}
      <div className="relative h-[420px] sm:h-[480px] rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-900 to-purple-900 overflow-hidden border-2 border-slate-700 shadow-xl">
        {/* Stars background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(2px 2px at 20% 15%, white, transparent), radial-gradient(2px 2px at 60% 30%, rgba(255,255,255,0.85), transparent), radial-gradient(1.5px 1.5px at 80% 60%, rgba(255,255,255,0.7), transparent), radial-gradient(2px 2px at 30% 75%, rgba(255,255,255,0.6), transparent), radial-gradient(1.5px 1.5px at 90% 90%, white, transparent), radial-gradient(2px 2px at 50% 50%, rgba(255,255,255,0.4), transparent)',
            backgroundSize: '100% 100%',
          }}
        />
        {/* Bottom danger line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_10px_rgba(244,63,94,0.6)]" />

        {/* Falling words */}
        {active.map((w) => (
          <div
            key={w.id}
            className={`absolute px-3 py-1.5 rounded-full text-white text-sm font-bold shadow-lg bg-gradient-to-br ${PILL_COLORS[w.color]} whitespace-nowrap`}
            style={{
              left: `${w.x}%`,
              top: `${w.y}%`,
              transition: 'top 50ms linear',
            }}
          >
            {w.term}
          </div>
        ))}

        {/* Feedback overlay */}
        {feedback && (
          <div
            className={`absolute inset-0 pointer-events-none animate-fade-in ${
              feedback === 'hit'
                ? 'bg-emerald-500/15 ring-4 ring-emerald-400/40 ring-inset'
                : 'bg-rose-500/15 ring-4 ring-rose-400/40 ring-inset'
            }`}
          />
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          autoFocus
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('games.typeAnswer')}
          className={`input flex-1 text-base py-3 transition-all ${
            feedback === 'hit'
              ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
              : feedback === 'miss'
              ? 'border-rose-500 shadow-lg shadow-rose-500/20'
              : ''
          }`}
        />
        <button
          onClick={submit}
          disabled={!answer}
          className="btn-primary px-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="flex justify-between">
        <div className="h-8 w-20 rounded-full skeleton-shimmer" />
        <div className="h-8 w-24 rounded skeleton-shimmer" />
      </div>
      <div className="h-[420px] rounded-3xl skeleton-shimmer" />
      <div className="h-12 rounded-xl skeleton-shimmer" />
    </div>
  );
}
