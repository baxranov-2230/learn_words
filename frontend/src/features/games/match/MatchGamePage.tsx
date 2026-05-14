import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { gamesApi } from '@/api/games';
import { GameBreadcrumb, useLessonContext } from '../GameBreadcrumb';
import { useSessionStore } from '@/store/sessionStore';
import type { FlashcardItem } from '@/types';

interface Tile {
  id: string;
  cardId: number;
  text: string;
  side: 'term' | 'definition';
  matched: boolean;
}

const ROUND_SIZE = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2, '0')}`;
}

function buildTiles(items: FlashcardItem[]): Tile[] {
  const list: Tile[] = [];
  items.forEach((c) => {
    list.push({
      id: `${c.card_id}-t`,
      cardId: c.card_id,
      text: c.term,
      side: 'term',
      matched: false,
    });
    list.push({
      id: `${c.card_id}-d`,
      cardId: c.card_id,
      text: c.definition,
      side: 'definition',
      matched: false,
    });
  });
  return shuffle(list);
}

export function MatchGamePage() {
  const { id } = useParams();
  const deckId = Number(id);
  const setSessionActive = useSessionStore((s) => s.setSessionActive);

  useEffect(() => {
    setSessionActive(!gameDone);
    return () => setSessionActive(false);
  }, [gameDone, setSessionActive]);
  const lessonCtx = useLessonContext();

  const { data, isLoading } = useQuery({
    queryKey: ['game-match', deckId],
    queryFn: () => gamesApi.start('match', deckId, 200),
    enabled: !!deckId,
  });

  const allItems = useMemo(
    () => (data?.items ?? []) as FlashcardItem[],
    [data],
  );

  const totalRounds = Math.max(1, Math.ceil(allItems.length / ROUND_SIZE));

  const [round, setRound] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [wrongPair, setWrongPair] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const [gameDone, setGameDone] = useState(false);
  const [totalMatched, setTotalMatched] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  // Initialize / re-init when round or data changes
  useEffect(() => {
    if (!allItems.length) return;
    const slice = allItems.slice(round * ROUND_SIZE, (round + 1) * ROUND_SIZE);
    if (!slice.length) {
      setGameDone(true);
      return;
    }
    setTiles(buildTiles(slice));
    setSelected(null);
    setRoundDone(false);
    if (round === 0) {
      startedAtRef.current = Date.now();
      setElapsed(0);
      setTotalMatched(0);
    }
  }, [round, allItems]);

  // Timer
  useEffect(() => {
    if (gameDone || !tiles.length) return;
    const t = setInterval(
      () => setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000)),
      500,
    );
    return () => clearInterval(t);
  }, [gameDone, tiles.length]);

  // Detect round complete
  useEffect(() => {
    if (!tiles.length || roundDone) return;
    if (tiles.every((t) => t.matched)) {
      setRoundDone(true);
      setTotalMatched((m) => m + tiles.length / 2);
    }
  }, [tiles, roundDone]);

  // Auto-advance after short delay
  useEffect(() => {
    if (!roundDone) return;
    const timer = setTimeout(() => {
      if (round + 1 < totalRounds) {
        setRound((r) => r + 1);
      } else {
        setGameDone(true);
        const duration = Math.round(
          (Date.now() - startedAtRef.current) / 1000,
        );
        const score = Math.max(allItems.length * 10 - duration, 10);
        gamesApi
          .saveSession({
            deck_id: deckId,
            game_type: 'match',
            score,
            correct: allItems.length,
            incorrect: 0,
            duration_seconds: duration,
          })
          .catch(() => {});
      }
    }, 1100);
    return () => clearTimeout(timer);
  }, [roundDone, round, totalRounds, allItems.length, deckId]);

  const click = (tile: Tile) => {
    if (tile.matched || wrongPair.size || roundDone) return;
    if (!selected) {
      setSelected(tile);
      return;
    }
    if (selected.id === tile.id) {
      setSelected(null);
      return;
    }
    if (selected.cardId === tile.cardId && selected.side !== tile.side) {
      setTiles((arr) =>
        arr.map((tt) =>
          tt.cardId === tile.cardId ? { ...tt, matched: true } : tt,
        ),
      );
      setSelected(null);
    } else {
      setWrongPair(new Set([selected.id, tile.id]));
      setTimeout(() => {
        setWrongPair(new Set());
        setSelected(null);
      }, 600);
    }
  };

  if (isLoading) return <LoadingShell />;
  if (!allItems.length)
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-12 text-center max-w-md mx-auto">
        <p className="text-slate-500">{t('decks.empty')}</p>
      </div>
    );

  if (gameDone) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in-up">
        <div className="relative overflow-hidden rounded-3xl text-white p-8 sm:p-10 text-center bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600">
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/20 blur-3xl animate-float-slow" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/15 blur-3xl animate-float-slow" style={{ animationDelay: '3s' }} />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl mb-4 animate-scale-in">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {t('games.matched')}
            </h2>
            <div className="mt-3 text-2xl font-bold tabular-nums">
              {fmtTime(elapsed)}
            </div>
            <div className="mt-1 text-sm text-white/80">
              {totalRounds} {t('games.rounds')} · {allItems.length}{' '}
              {t('reader.words')}
            </div>
            <div className="mt-6 flex justify-center gap-2 flex-wrap">
              <Link
                to={lessonCtx.replayPath(deckId, 'match')}
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

  const matchedThisRound = tiles.filter((t) => t.matched).length / 2;
  const tilesPerRound = tiles.length / 2;
  const overallMatched = totalMatched + matchedThisRound;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <GameBreadcrumb gameKey="match" isGameActive={!gameDone} />

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 animate-fade-in-up">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {t('games.match')}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white">
            {t('games.roundOfTotal', {
              n: round + 1,
              total: totalRounds,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {overallMatched} / {allItems.length}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 tabular-nums">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {fmtTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Overall progress (across all words) */}
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${(overallMatched / allItems.length) * 100}%` }}
          />
        </div>
        {/* Round dots */}
        {totalRounds > 1 && (
          <div className="flex items-center gap-1.5 pt-1">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i < round
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    : i === round
                    ? 'bg-gradient-to-r from-sky-400 to-blue-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Round complete banner */}
      {roundDone && round + 1 < totalRounds && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 flex items-center gap-3 animate-fade-in-up shadow-lg shadow-emerald-500/25">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div className="flex-1">
            <div className="font-bold">
              {t('games.roundComplete', { n: round + 1 })}
            </div>
            <div className="text-xs text-white/85">
              {t('games.loadingNext')}
            </div>
          </div>
        </div>
      )}

      {/* Tiles */}
      <div
        key={round}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 animate-fade-in-up"
      >
        {tiles.map((tile, i) => {
          const isSelected = selected?.id === tile.id;
          const isWrong = wrongPair.has(tile.id);
          const isTerm = tile.side === 'term';
          return (
            <button
              key={tile.id}
              disabled={tile.matched || roundDone}
              onClick={() => click(tile)}
              className={`relative min-h-[88px] sm:min-h-[100px] rounded-2xl p-3 text-sm sm:text-base font-semibold transition-all duration-300 overflow-hidden border-2 animate-fade-in-up stagger-${(i % 6) + 1} ${
                tile.matched
                  ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/15 dark:to-teal-500/10 text-emerald-700 dark:text-emerald-300 opacity-60 scale-95'
                  : isWrong
                  ? 'border-rose-500 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-500/20 dark:to-pink-500/15 text-rose-700 dark:text-rose-300 animate-pulse'
                  : isSelected
                  ? `border-transparent bg-gradient-to-br ${
                      isTerm
                        ? 'from-sky-500 via-blue-500 to-indigo-600'
                        : 'from-emerald-500 via-teal-500 to-cyan-600'
                    } text-white shadow-lg scale-105`
                  : `border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:-translate-y-0.5 hover:shadow-md ${
                      isTerm
                        ? 'hover:border-sky-300 dark:hover:border-sky-500/50'
                        : 'hover:border-emerald-300 dark:hover:border-emerald-500/50'
                    }`
              }`}
            >
              <span
                className={`absolute top-1.5 left-2 text-[9px] font-bold uppercase tracking-widest ${
                  isSelected
                    ? 'text-white/70'
                    : tile.matched
                    ? 'text-emerald-500'
                    : isTerm
                    ? 'text-sky-500'
                    : 'text-emerald-500'
                }`}
              >
                {isTerm ? t('decks.card.term') : t('decks.card.definition')}
              </span>
              <span className="block mt-3 px-1 break-words leading-tight">
                {tile.text}
              </span>
              {tile.matched && (
                <span className="absolute top-1.5 right-2 text-emerald-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* In-round helper text */}
      <div className="text-center text-xs text-slate-400">
        {t('games.matchHint', { n: tilesPerRound })}
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="h-6 rounded skeleton-shimmer w-32" />
      <div className="h-2 rounded-full skeleton-shimmer" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}
