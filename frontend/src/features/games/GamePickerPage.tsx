import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

interface GameDef {
  id: 'flashcards' | 'test' | 'match' | 'spelling' | 'scramble';
  key: string;
  descKey: string;
  gradient: string;
  shadow: string;
  icon: ReactNode;
}

const GAMES: GameDef[] = [
  {
    id: 'flashcards',
    key: 'flashcards',
    descKey: 'lesson.gameMatchDesc',
    gradient: 'from-success-500 to-success-600',
    shadow: 'shadow-success-500/30',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="14" height="14" rx="2" />
        <path d="M8 2h14v14" />
      </svg>
    ),
  },
  {
    id: 'test',
    key: 'test',
    descKey: 'lesson.gameTestDesc',
    gradient: 'from-primary-500 to-primary-600',
    shadow: 'shadow-primary-500/30',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: 'match',
    key: 'match',
    descKey: 'lesson.gameMatchDesc',
    gradient: 'from-sky-500 to-primary-600',
    shadow: 'shadow-sky-500/30',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    id: 'spelling',
    key: 'spelling',
    descKey: 'lesson.gameSpellingDesc',
    gradient: 'from-xp-400 to-streak-500',
    shadow: 'shadow-streak-500/30',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    id: 'scramble',
    key: 'scramble',
    descKey: 'lesson.gameScrambleDesc',
    gradient: 'from-lives-500 to-lives-600',
    shadow: 'shadow-lives-500/30',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="5" rx="1" />
        <rect x="3" y="16" width="5" height="5" rx="1" />
        <rect x="16" y="3" width="5" height="5" rx="1" />
        <rect x="16" y="16" width="5" height="5" rx="1" />
        <path d="M8 5.5h8M8 18.5h8M5.5 8v8M18.5 8v8" strokeDasharray="2 2" />
      </svg>
    ),
  },
];

export function GamePickerPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {t('games.selectGame')}
        </h1>
        <p className="text-sm text-slate-500 mt-2">{t('games.pickerHint')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g, i) => (
          <Link
            key={g.id}
            to={`/decks/${id}/play/${g.id}`}
            className={`group card overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${g.shadow} hover:border-primary-400 dark:hover:border-primary-500 animate-fade-in-up stagger-${(i % 6) + 1}`}
          >
            <div
              className={`pointer-events-none absolute -right-12 -top-12 w-40 h-40 rounded-full bg-gradient-to-br ${g.gradient} opacity-15 blur-2xl transition-all duration-700 group-hover:opacity-30 group-hover:scale-125`}
            />
            <div className="relative p-6">
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${g.gradient} text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6`}
              >
                {g.icon}
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-slate-100">{t(`games.${g.key}`)}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {t(g.descKey)}
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {t('games.start')}
                <svg
                  className="transition-transform group-hover:translate-x-1"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
