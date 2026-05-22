import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';
import { languagesApi } from '@/api/languages';
import { courseGradient } from '@/features/courses/courseGradient';
import { CourseManagePanel } from './CourseManagePanel';

export function CoursesAdmin() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list(),
  });
  const { data: languages } = useQuery({
    queryKey: ['languages-all'],
    queryFn: () => languagesApi.list({ all: true }),
  });

  const langMap = useMemo(() => {
    const map = new Map<number, { name: string; flag?: string | null; code: string }>();
    languages?.forEach((l) => map.set(l.id, { name: l.name, flag: l.flag, code: l.code }));
    return map;
  }, [languages]);

  const [managingId, setManagingId] = useState<number | null>(null);

  const removeMut = useMutation({
    mutationFn: (id: number) => coursesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });

  const totalDecks = useMemo(() => courses?.reduce((s, c) => s + c.decks_count, 0) ?? 0, [courses]);
  const totalStories = useMemo(() => courses?.reduce((s, c) => s + c.stories_count, 0) ?? 0, [courses]);

  if (managingId !== null) {
    return <CourseManagePanel courseId={managingId} onBack={() => setManagingId(null)} />;
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold">{t('admin.courses.existing')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('admin.courses.summary', {
              total: courses?.length ?? 0,
              decks: totalDecks,
              stories: totalStories,
            })}
          </p>
        </div>
        <Link
          to="/admin/courses/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          {t('admin.courses.newTitle')}
        </Link>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        )}

        {!isLoading && (!courses || courses.length === 0) && (
          <div className="px-5 py-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 mb-4">{t('admin.courses.empty')}</p>
            <Link
              to="/admin/courses/new"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('admin.courses.newTitle')} →
            </Link>
          </div>
        )}

        {!isLoading && courses && courses.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map((c, i) => {
              const gradient = courseGradient(c.cover_color, c.title || String(i));
              return (
                <li
                  key={c.id}
                  className={`px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group animate-fade-in-up stagger-${(i % 6) + 1}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {c.level && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {c.level}
                        </span>
                      )}
                      {c.language_id && langMap.get(c.language_id) && (() => {
                        const lang = langMap.get(c.language_id!)!;
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                            {lang.flag || lang.code.toUpperCase()}
                            <span>{lang.name}</span>
                          </span>
                        );
                      })()}
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 7l10-5 10 5-10 5L2 7z" />
                        </svg>
                        {c.decks_count}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        {c.stories_count}
                      </span>
                      {!c.is_published && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                          {t('admin.stories.draft')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setManagingId(c.id)}
                      title={t('admin.courses.manage')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-all"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span className="hidden sm:inline">{t('admin.courses.manage')}</span>
                    </button>
                    <Link
                      to={`/courses/${c.id}`}
                      title={t('admin.courses.preview')}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-500/10 transition-all"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    </Link>
                    <Link
                      to={`/admin/courses/${c.id}/edit`}
                      title={t('admin.courses.editTitle')}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 transition-all"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(t('admin.courses.deleteConfirm'))) removeMut.mutate(c.id);
                      }}
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
