import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storiesApi } from '@/api/stories';
import { adminApi } from '@/api/admin';
import { coursesApi } from '@/api/courses';

export function StoriesAdmin() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: stories, isLoading } = useQuery({
    queryKey: ['stories', 'admin'],
    queryFn: () => storiesApi.list({}),
  });
  const { data: decks } = useQuery({
    queryKey: ['admin-decks'],
    queryFn: () => adminApi.decks({ page_size: 200 }),
  });
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list(),
  });

  const [search, setSearch] = useState('');

  const deckMap = useMemo(() => {
    const map = new Map<number, string>();
    decks?.forEach((d) => map.set(d.id, d.title));
    return map;
  }, [decks]);

  const courseMap = useMemo(() => {
    const map = new Map<number, string>();
    courses?.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [courses]);

  const removeMut = useMutation({
    mutationFn: (id: number) => storiesApi.removeAdmin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });

  const filtered = useMemo(() => {
    if (!stories) return [];
    const q = search.trim().toLowerCase();
    if (!q) return stories;
    return stories.filter((s) => {
      const deckTitle = s.deck_id ? deckMap.get(s.deck_id) ?? '' : '';
      return (
        s.title.toLowerCase().includes(q) ||
        (s.topic ?? '').toLowerCase().includes(q) ||
        (s.level ?? '').toLowerCase().includes(q) ||
        deckTitle.toLowerCase().includes(q)
      );
    });
  }, [stories, search, deckMap]);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold">{t('admin.stories.existing')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{stories?.length ?? 0} ta hikoya</p>
        </div>
        <Link
          to="/admin/stories/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          {t('admin.stories.newTitle')}
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.stories.searchPh')}
          className="input pl-9 w-full"
        />
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 mb-4">{t('admin.stories.empty')}</p>
            {!search && (
              <Link
                to="/admin/stories/new"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {t('admin.stories.newTitle')} →
              </Link>
            )}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((s, i) => {
              const linkedDeck = s.deck_id ? deckMap.get(s.deck_id) : null;
              const linkedCourse = s.course_id ? courseMap.get(s.course_id) : null;
              return (
                <li
                  key={s.id}
                  className={`px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group animate-fade-in-up stagger-${(i % 6) + 1}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{s.title}</div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {s.level && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {s.level}
                        </span>
                      )}
                      {linkedCourse && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300 max-w-[140px]">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                          <span className="truncate">{linkedCourse}</span>
                        </span>
                      )}
                      {linkedDeck ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 max-w-[160px]">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 7l10-5 10 5-10 5L2 7z" />
                          </svg>
                          <span className="truncate">{linkedDeck}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                          {t('admin.stories.noDeck')}
                        </span>
                      )}
                      {!s.is_published && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                          {t('admin.stories.draft')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/admin/stories/${s.id}/edit`}
                      title={t('admin.stories.edit')}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 transition-all"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(t('admin.stories.deleteConfirm'))) removeMut.mutate(s.id);
                      }}
                      aria-label="delete"
                      title={t('common.delete')}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-lives-50 hover:text-lives-600 dark:hover:bg-lives-500/10 transition-all"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
