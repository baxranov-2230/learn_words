import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { gamesApi } from '@/api/games';
import { progressApi } from '@/api/progress';
import { GameBreadcrumb } from '../GameBreadcrumb';
import { useSessionStore } from '@/store/sessionStore';
import type { FlashcardItem } from '@/types';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface LetterTile {
  id: number;
  char: string;
  used: boolean;
}

function buildTiles(word: string): LetterTile[] {
  const letters = word.split('').map((char, i) => ({ id: i, char, used: false }));
  return shuffleArray(letters);
}

function LoadingShell() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-primary-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ScrambleGamePage() {
  const { id } = useParams();
  const deckId = Number(id);
  const { t } = useTranslation();
  const setSessionActive = useSessionStore((s) => s.setSessionActive);

  const { data, isLoading } = useQuery({
    queryKey: ['game-scramble', deckId],
    queryFn: () => gamesApi.start('spelling', deckId, 200),
    enabled: !!deckId,
  });
  const items = (data?.items ?? []) as FlashcardItem[];

  const [idx, setIdx] = useState(0);
  const [tiles, setTiles] = useState<LetterTile[]>([]);
  const [chosen, setChosen] = useState<LetterTile[]>([]);
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useState(() => Date.now())[0];

  const currentItem = items[idx];
  const answer = currentItem?.term ?? '';

  useEffect(() => {
    setSessionActive(!done);
    return () => setSessionActive(false);
  }, [done, setSessionActive]);

  useEffect(() => {
    if (currentItem) {
      setTiles(buildTiles(answer));
      setChosen([]);
      setFeedback(null);
    }
  }, [idx, currentItem, answer]);

  const resetTiles = useCallback(() => {
    setTiles((prev) => prev.map((t) => ({ ...t, used: false })));
    setChosen([]);
    setFeedback(null);
  }, []);

  const advance = useCallback(
    (wasCorrect: boolean, corrCount: number, incorrCount: number) => {
      progressApi
        .review({ card_id: currentItem?.card_id ?? 0, quality: wasCorrect ? 5 : 1 })
        .catch(() => {});

      if (idx + 1 >= items.length) {
        const duration = Math.round((Date.now() - startedAt) / 1000);
        gamesApi
          .saveSession({
            deck_id: deckId,
            game_type: 'spelling',
            score: corrCount,
            correct: corrCount,
            incorrect: incorrCount,
            duration_seconds: duration,
          })
          .catch(() => {});
        setDone(true);
      } else {
        setIdx((i) => i + 1);
      }
    },
    [idx, items.length, currentItem, deckId, startedAt],
  );

  const handleTilePick = useCallback(
    (tile: LetterTile) => {
      if (tile.used || feedback) return;
      setTiles((prev) => prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));
      setChosen((prev) => {
        const next = [...prev, tile];
        const formed = next.map((t) => t.char).join('');
        if (formed === answer) {
          const newCorrect = correct + 1;
          setFeedback('correct');
          setCorrect(newCorrect);
          setTimeout(() => advance(true, newCorrect, incorrect), 900);
        } else if (next.length === answer.length) {
          const newIncorrect = incorrect + 1;
          setFeedback('wrong');
          setIncorrect(newIncorrect);
          setTimeout(() => {
            setTiles((p) => p.map((t) => ({ ...t, used: false })));
            setChosen([]);
            setFeedback(null);
          }, 800);
        }
        return next;
      });
    },
    [feedback, answer, correct, incorrect, advance],
  );

  const handleChosenRemove = useCallback(
    (tile: LetterTile, chosenIdx: number) => {
      if (feedback) return;
      setChosen((prev) => prev.filter((_, i) => i !== chosenIdx));
      setTiles((prev) => prev.map((t) => (t.id === tile.id ? { ...t, used: false } : t)));
    },
    [feedback],
  );

  const handleSkip = useCallback(() => {
    const newIncorrect = incorrect + 1;
    setIncorrect(newIncorrect);
    advance(false, correct, newIncorrect);
  }, [incorrect, correct, advance]);

  if (isLoading) return <LoadingShell />;
  if (!items.length)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <p className="font-semibold">{t('decks.empty', 'Kartochkalar yo\'q')}</p>
      </div>
    );

  if (done) {
    const total = correct + incorrect;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12 animate-fade-in-up">
        <GameBreadcrumb gameKey="scramble" isGameActive={false} />
        <div className="text-6xl">{pct >= 70 ? '🎉' : '💪'}</div>
        <h2 className="text-3xl font-extrabold">
          {pct >= 70 ? t('games.greatJob') : t('games.tryHarder')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <div className="text-2xl font-extrabold text-success-500">{correct}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              {t('games.correct')}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-extrabold text-lives-500">{incorrect}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              {t('games.incorrect')}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-extrabold text-slate-500">{elapsed}s</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              {t('games.time')}
            </div>
          </div>
        </div>
        <button
          className="btn-3d-primary btn-3d-lg w-full"
          onClick={() => {
            setIdx(0);
            setCorrect(0);
            setIncorrect(0);
            setDone(false);
          }}
        >
          {t('games.playAgain')}
        </button>
      </div>
    );
  }

  const progress = idx / items.length;
  const blanks = Array.from({ length: answer.length });

  return (
    <div className="max-w-lg mx-auto space-y-6 py-4">
      <GameBreadcrumb gameKey="scramble" isGameActive={!done} />

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Counter */}
      <div className="flex justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider">
        <span>
          {idx + 1} / {items.length}
        </span>
        <span className="text-success-500">{correct} ✓</span>
      </div>

      {/* Question card */}
      <div
        className={`card p-6 text-center transition-all duration-300 ${
          feedback === 'correct'
            ? 'border-success-400 bg-success-50 dark:bg-success-900/20'
            : feedback === 'wrong'
              ? 'border-lives-400 bg-lives-50 dark:bg-lives-900/20 animate-shake'
              : ''
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
          {t('games.spellQuestion')}
        </p>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          {currentItem?.definition}
        </p>
        {currentItem?.transcription && (
          <p className="text-sm text-slate-400 mt-1 italic">{currentItem.transcription}</p>
        )}
      </div>

      {/* Answer blanks */}
      <div className="flex flex-wrap justify-center gap-2 min-h-[56px]">
        {blanks.map((_, i) => {
          const tile = chosen[i];
          return (
            <button
              key={i}
              onClick={() => tile && handleChosenRemove(tile, i)}
              className={`w-11 h-11 rounded-xl border-2 font-extrabold text-lg transition-all duration-150 ${
                tile
                  ? feedback === 'correct'
                    ? 'bg-success-500 border-success-600 text-white scale-105'
                    : feedback === 'wrong'
                      ? 'bg-lives-500 border-lives-600 text-white animate-shake'
                      : 'bg-primary-500 border-primary-700 text-white hover:bg-primary-400 active:scale-95'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent'
              }`}
            >
              {tile?.char ?? ''}
            </button>
          );
        })}
      </div>

      {/* Scrambled letter tiles */}
      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => handleTilePick(tile)}
            disabled={tile.used || !!feedback}
            className={`w-11 h-11 rounded-xl border-2 font-extrabold text-lg transition-all duration-150 ${
              tile.used
                ? 'opacity-0 pointer-events-none'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:bg-primary-50 hover:border-primary-400 dark:hover:bg-primary-900/30 dark:hover:border-primary-500 active:scale-95 shadow-sm'
            }`}
          >
            {tile.char}
          </button>
        ))}
      </div>

      {/* Reset */}
      {chosen.length > 0 && !feedback && (
        <div className="text-center">
          <button
            onClick={resetTiles}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline underline-offset-2 transition-colors"
          >
            {t('games.reset', 'Tozalash')}
          </button>
        </div>
      )}

      {/* Skip */}
      {!feedback && (
        <div className="text-center">
          <button onClick={handleSkip} className="btn-3d-ghost">
            {t('games.skip', "O'tkazib yuborish")}
          </button>
        </div>
      )}
    </div>
  );
}
