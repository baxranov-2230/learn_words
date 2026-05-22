import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { languagesApi } from '@/api/languages';
import { courseGradient } from '@/features/courses/courseGradient';

export function LanguagesAdmin() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: languages, isLoading } = useQuery({
    queryKey: ['languages-all'],
    queryFn: () => languagesApi.list({ all: true }),
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => languagesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['languages-all'] });
      qc.invalidateQueries({ queryKey: ['languages'] });
    },
  });

  const totals = useMemo(() => {
    const total = languages?.length ?? 0;
    const active = languages?.filter((l) => l.is_active).length ?? 0;
    return { total, active };
  }, [languages]);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{t('admin.languages.existing')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('admin.languages.summary', { total: totals.total, active: totals.active })}
          </p>
        </div>
        <Link
          to="/admin/languages/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          {t('admin.languages.saveNew')}
        </Link>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        )}

        {!isLoading && (!languages || languages.length === 0) && (
          <div className="px-5 py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 text-3xl mb-3">
              🌐
            </div>
            <p className="text-sm text-slate-500 mb-4">{t('admin.languages.empty')}</p>
            <Link
              to="/admin/languages/new"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('admin.languages.saveNew')} →
            </Link>
          </div>
        )}

        {!isLoading && languages && languages.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {languages.map((l, i) => {
              const gradient = courseGradient(l.color, l.code);
              return (
                <li
                  key={l.id}
                  className={`px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group animate-fade-in-up stagger-${(i % 6) + 1}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center flex-shrink-0 shadow-md text-xl font-extrabold`}>
                    {l.flag || l.code.toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold flex items-center gap-2 flex-wrap">
                      {l.name}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {l.code}
                      </span>
                      {!l.is_active && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                          {t('admin.languages.inactive')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {l.native_name || '—'} · {l.courses_count} {t('courses.title').toLowerCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/admin/languages/${l.id}/edit`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 transition-all"
                      title={t('admin.languages.editTitle')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(t('admin.languages.deleteConfirm'))) removeMut.mutate(l.id);
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
