import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { progressApi } from '@/api/progress';
import { useAuthStore } from '@/store/authStore';
import type { WeakCard } from '@/types';

export function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [weakTab, setWeakTab] = useState<'flashcard' | 'test'>('flashcard');

  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => authApi.me(),
    staleTime: 60_000,
  });

  const { data: progress } = useQuery({
    queryKey: ['progress', 'me'],
    queryFn: () => progressApi.me(),
    staleTime: 0,
  });

  const { data: flashcardWeak = [], isLoading: flashcardLoading } = useQuery({
    queryKey: ['progress', 'weak', 'flashcard'],
    queryFn: () => progressApi.weak('flashcard', 500),
    staleTime: 0,
  });

  const { data: testWeak = [], isLoading: testLoading } = useQuery({
    queryKey: ['progress', 'weak', 'test'],
    queryFn: () => progressApi.weak('test', 500),
    staleTime: 0,
  });

  const weakCards = weakTab === 'flashcard' ? flashcardWeak : testWeak;
  const weakLoading = weakTab === 'flashcard' ? flashcardLoading : testLoading;
  const weakCount = weakTab === 'flashcard' ? flashcardWeak.length : testWeak.length;

  const filtered = weakCards.filter(
    (c) =>
      c.term.toLowerCase().includes(search.toLowerCase()) ||
      c.definition.toLowerCase().includes(search.toLowerCase()),
  );

  const currentUser = me ?? user;
  const streak = progress?.current_streak ?? 0;
  const mastered = progress?.mastered ?? 0;
  const learning = progress?.learning ?? 0;
  const total = progress?.total_cards ?? 0;
  const totalWeakCount = flashcardWeak.length + testWeak.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Profile card */}
      <div className="card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary-500 via-primary-600 to-sky-500 relative">
          <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-20" />
        </div>
        <div className="px-6 pb-6 -mt-10">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center overflow-hidden">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-sky-500 flex items-center justify-center text-white text-3xl font-extrabold">
                {(currentUser?.username?.[0] ?? '?').toUpperCase()}
              </div>
            )}
          </div>
          <div className="mt-3">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{currentUser?.username}</h1>
            <p className="text-sm text-slate-400 font-medium mt-0.5">{currentUser?.email}</p>
            {currentUser?.role === 'admin' && (
              <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label={t('profile.streak')}
          value={streak}
          color="text-streak-500"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-streak-500">
              <path d="M12 2s2 3 2 5.5c0 1.5-.7 2.5-1.7 3.5C13.3 12 14 11 14 9c1 1 3 3.5 3 7 0 3.31-2.69 6-6 6s-6-2.69-6-6c0-3.6 3-7 3-7 0 2 .7 3 1.7 4-1-1-1.7-2-1.7-3.5C8 4 12 2 12 2z" />
            </svg>
          }
        />
        <StatCard
          label={t('profile.mastered')}
          value={mastered}
          color="text-success-500"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-success-500">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
        <StatCard
          label={t('profile.learning')}
          value={learning}
          color="text-primary-500"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        />
        <StatCard
          label={t('profile.weakWords')}
          value={totalWeakCount}
          color="text-lives-500"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-lives-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
      </div>

      {/* Mastery progress bar */}
      {total > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-3">
            {t('profile.masteryProgress')}
          </h2>
          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            {mastered > 0 && (
              <div className="h-full bg-success-500 transition-all duration-700" style={{ width: `${(mastered / total) * 100}%` }} />
            )}
            {learning > 0 && (
              <div className="h-full bg-primary-400 transition-all duration-700" style={{ width: `${(learning / total) * 100}%` }} />
            )}
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-400 mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success-500 inline-block" />
              {t('profile.mastered')}: {mastered}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-400 inline-block" />
              {t('profile.learning')}: {learning}
            </span>
            <span>{t('profile.total')}: {total}</span>
          </div>
        </div>
      )}

      {/* Weak words — collapsible block */}
      <div className="card overflow-hidden">
        {/* Header — always visible, clickable to expand */}
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lives-50 dark:bg-lives-900/30 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-lives-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                {t('profile.weakTitle')}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{t('profile.weakDesc')}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalWeakCount > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-lives-100 dark:bg-lives-900/30 text-lives-600 dark:text-lives-400 text-xs font-extrabold">
                {totalWeakCount}
              </span>
            )}
            <svg
              className={`text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {/* Expandable content */}
        {expanded && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-5 pb-5 pt-4 space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                onClick={() => { setWeakTab('flashcard'); setSearch(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  weakTab === 'flashcard'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="14" height="14" rx="2" />
                  <path d="M8 2h14v14" />
                </svg>
                {t('games.flashcards')}
                {flashcardWeak.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-lg bg-lives-100 dark:bg-lives-900/40 text-lives-600 dark:text-lives-400 text-[10px] font-extrabold">
                    {flashcardWeak.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setWeakTab('test'); setSearch(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  weakTab === 'test'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                {t('games.test')}
                {testWeak.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-lg bg-lives-100 dark:bg-lives-900/40 text-lives-600 dark:text-lives-400 text-[10px] font-extrabold">
                    {testWeak.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder={t('profile.searchWords')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 py-2 text-sm"
              />
            </div>

            {/* Cards grid */}
            {weakLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <svg className="mx-auto mb-3 text-slate-300 dark:text-slate-600" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <p className="font-semibold text-sm">
                  {search ? t('profile.noSearchResults') : t('profile.noWeakWords')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filtered.map((card) => (
                  <WeakCardBlock key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      {icon}
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-tight">{label}</div>
    </div>
  );
}

function WeakCardBlock({ card }: { card: WeakCard }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative h-28 [perspective:800px] cursor-pointer select-none"
      onClick={() => setFlipped((f) => !f)}
    >
      <div className={`absolute inset-0 [transform-style:preserve-3d] transition-transform duration-500 ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        {/* Front — inglizcha */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex flex-col justify-between hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
          <div className="flex items-start justify-between gap-1">
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2">{card.term}</span>
            <span className="flex-shrink-0 text-[10px] font-extrabold text-lives-500 bg-lives-50 dark:bg-lives-900/30 px-1.5 py-0.5 rounded-lg">✗{card.incorrect_count}</span>
          </div>
          {card.transcription && (
            <div className="text-[10px] text-slate-400 italic truncate">{card.transcription}</div>
          )}
          <div className="text-[10px] text-slate-300 dark:text-slate-600 font-semibold">bosing →</div>
        </div>
        {/* Back — o'zbekcha */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border-2 border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 p-3 flex flex-col justify-center items-center text-center">
          <div className="text-[9px] font-extrabold uppercase tracking-widest text-primary-400 mb-1">tarjima</div>
          <div className="font-extrabold text-primary-700 dark:text-primary-300 text-sm leading-tight">{card.definition}</div>
        </div>
      </div>
    </div>
  );
}
