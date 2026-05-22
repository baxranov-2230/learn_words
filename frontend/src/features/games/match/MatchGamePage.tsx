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
  const terms: Tile[] = [];
  const defs: Tile[] = [];
  items.forEach((c) => {
    terms.push({
      id: `${c.card_id}-t`,
      cardId: c.card_id,
      text: c.term,
      side: 'term',
      matched: false,
    });
    defs.push({
      id: `${c.card_id}-d`,
      cardId: c.card_id,
      text: c.definition,
      side: 'definition',
      matched: false,
    });
  });
  // Shuffle terms and definitions separately so columns are independent
  return [...shuffle(terms), ...shuffle(defs)];
}

export function MatchGamePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const deckId = Number(id);
  const setSessionActive = useSessionStore((s) => s.setSessionActive);
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
  const [justMatched, setJustMatched] = useState<Set<number>>(new Set());
  const startedAtRef = useRef<number>(Date.now());

  // Block sidebar navigation while game is active
  useEffect(() => {
    setSessionActive(!gameDone);
    return () => setSessionActive(false);
  }, [gameDone, setSessionActive]);

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
    setWrongPair(new Set());
    setJustMatched(new Set());
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
    const tmr = setInterval(
      () => setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000)),
      500,
    );
    return () => clearInterval(tmr);
  }, [gameDone, tiles.length]);

  // Detect round complete
  useEffect(() => {
    if (!tiles.length || roundDone) return;
    if (tiles.every((tile) => tile.matched)) {
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
    if (tile.matched || wrongPair.size > 0 || roundDone) return;

    // Tap-again to deselect
    if (selected?.id === tile.id) {
      setSelected(null);
      return;
    }

    // No prior selection → just select
    if (!selected) {
      setSelected(tile);
      return;
    }

    // Both same side (term+term or def+def) → switch selection
    if (selected.side === tile.side) {
      setSelected(tile);
      return;
    }

    // Different sides — check match
    if (selected.cardId === tile.cardId) {
      const matchedCardId = tile.cardId;
      setTiles((arr) =>
        arr.map((tt) =>
          tt.cardId === matchedCardId ? { ...tt, matched: true } : tt,
        ),
      );
      setJustMatched((prev) => new Set(prev).add(matchedCardId));
      // Clear the "just matched" highlight after a short flash
      setTimeout(() => {
        setJustMatched((prev) => {
          const next = new Set(prev);
          next.delete(matchedCardId);
          return next;
        });
      }, 700);
      setSelected(null);
    } else {
      // Wrong pair — flash red
      setWrongPair(new Set([selected.id, tile.id]));
      setTimeout(() => {
        setWrongPair(new Set());
        setSelected(null);
      }, 700);
    }
  };

  if (isLoading) return <LoadingShell />;
  if (!allItems.length)
    return (
      <div className="card p-12 text-center max-w-md mx-auto">
        <p className="font-bold text-slate-500">{t('decks.empty')}</p>
      </div>
    );

  if (gameDone) {
    const score = Math.max(allItems.length * 10 - elapsed, 10);
    return (
      <div className="max-w-lg mx-auto animate-fade-in-up">
        <div className="relative overflow-hidden rounded-3xl text-white p-8 sm:p-10 text-center bg-gradient-to-br from-success-500 via-success-600 to-primary-600 shadow-2xl">
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/15 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/25 backdrop-blur-sm border-2 border-white/30 shadow-xl mb-4 animate-scale-in">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {t('games.matched')}
            </h2>
            <div className="mt-4 inline-flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/15 backdrop-blur-sm">
              <span className="inline-flex items-center gap-1.5 font-extrabold tabular-nums">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 4 9l8 13 8-13-8-7z" />
                </svg>
                {score} XP
              </span>
              <span className="w-px h-5 bg-white/40" />
              <span className="font-extrabold tabular-nums">{fmtTime(elapsed)}</span>
            </div>
            <div className="mt-3 text-sm text-white/85 font-semibold">
              {totalRounds} {t('games.rounds')} · {allItems.length}{' '}
              {t('reader.words')}
            </div>
            <div className="mt-6 flex justify-center gap-3 flex-wrap">
              <Link
                to={lessonCtx.replayPath(deckId, 'match')}
                className="btn-3d-xp"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
                {t('games.playAgain')}
              </Link>
              {lessonCtx.backToLessonPath && (
                <Link
                  to={lessonCtx.backToLessonPath}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-sm font-extrabold uppercase tracking-wider hover:bg-white/30 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
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

  const matchedThisRound = tiles.filter((tile) => tile.matched).length / 2;
  const tilesPerRound = tiles.length / 2;
  const overallMatched = totalMatched + matchedThisRound;

  // Split tiles by side so we can render two columns: terms (left) and definitions (right)
  const termTiles = tiles.filter((tile) => tile.side === 'term');
  const defTiles = tiles.filter((tile) => tile.side === 'definition');

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <GameBreadcrumb gameKey="match" isGameActive={!gameDone} />

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 animate-fade-in-up">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('games.match')}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-xl bg-primary-500 text-white">
            {t('games.roundOfTotal', {
              n: round + 1,
              total: totalRounds,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-extrabold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {overallMatched} / {allItems.length}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-400 tabular-nums">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {fmtTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Overall progress */}
      <div className="space-y-2">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(overallMatched / allItems.length) * 100}%` }}
          />
        </div>
        {totalRounds > 1 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i < round
                    ? 'bg-success-500'
                    : i === round
                    ? 'bg-primary-500'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Round complete banner */}
      {roundDone && round + 1 < totalRounds && (
        <div className="rounded-2xl bg-success-500 text-white p-4 flex items-center gap-3 animate-fade-in-up shadow-lg shadow-success-500/30">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/25 border-2 border-white/30 flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div className="flex-1">
            <div className="font-extrabold">
              {t('games.roundComplete', { n: round + 1 })}
            </div>
            <div className="text-xs font-semibold text-white/90">
              {t('games.loadingNext')}
            </div>
          </div>
        </div>
      )}

      {/* Two columns: terms (left) / definitions (right) */}
      <div key={round} className="grid grid-cols-2 gap-3 sm:gap-4 animate-fade-in-up">
        <div className="space-y-2.5 sm:space-y-3">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 px-1">
            {t('decks.card.term')}
          </div>
          {termTiles.map((tile, i) => (
            <MatchTile
              key={tile.id}
              tile={tile}
              index={i}
              selected={selected?.id === tile.id}
              wrong={wrongPair.has(tile.id)}
              justMatched={justMatched.has(tile.cardId)}
              onClick={() => click(tile)}
              disabled={tile.matched || roundDone}
            />
          ))}
        </div>
        <div className="space-y-2.5 sm:space-y-3">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-success-600 dark:text-success-400 px-1 text-right">
            {t('decks.card.definition')}
          </div>
          {defTiles.map((tile, i) => (
            <MatchTile
              key={tile.id}
              tile={tile}
              index={i}
              selected={selected?.id === tile.id}
              wrong={wrongPair.has(tile.id)}
              justMatched={justMatched.has(tile.cardId)}
              onClick={() => click(tile)}
              disabled={tile.matched || roundDone}
            />
          ))}
        </div>
      </div>

      {/* Helper hint */}
      <div className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
        {t('games.matchHint', { n: tilesPerRound })}
      </div>
    </div>
  );
}

function MatchTile({
  tile,
  index,
  selected,
  wrong,
  justMatched,
  onClick,
  disabled,
}: {
  tile: Tile;
  index: number;
  selected: boolean;
  wrong: boolean;
  justMatched: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const isTerm = tile.side === 'term';
  const accent = isTerm ? 'primary' : 'success';

  let stateClass: string;
  if (tile.matched) {
    stateClass = `border-success-300 dark:border-success-500/40 bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 opacity-50 ${
      justMatched ? 'animate-pop' : ''
    }`;
  } else if (wrong) {
    stateClass =
      'border-lives-500 bg-lives-50 dark:bg-lives-500/15 text-lives-700 dark:text-lives-400 animate-shake';
  } else if (selected) {
    stateClass =
      accent === 'primary'
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 scale-[1.02] shadow-lg shadow-primary-500/20'
        : 'border-success-500 bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-300 scale-[1.02] shadow-lg shadow-success-500/20';
  } else {
    stateClass =
      accent === 'primary'
        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-primary-400 hover:-translate-y-0.5'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-success-400 hover:-translate-y-0.5';
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative w-full min-h-[68px] sm:min-h-[78px] rounded-2xl p-3 text-sm sm:text-base font-bold transition-all duration-200 border-2 text-left overflow-hidden animate-fade-in-up stagger-${(index % 6) + 1} ${stateClass} disabled:cursor-default`}
    >
      <span className="block break-words leading-snug">{tile.text}</span>
      {tile.matched && (
        <span className="absolute top-2 right-2 text-success-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </button>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="h-6 rounded skeleton-shimmer w-32" />
      <div className="h-2 rounded-full skeleton-shimmer" />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
