import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '@/api/courses';
import { languagesApi } from '@/api/languages';
import { courseGradient } from './courseGradient';
import type { Course } from '@/types';

export function CoursesListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const langParam = searchParams.get('language');
  const languageId = langParam ? Number(langParam) : null;

  const [level, setLevel] = useState<string>('');
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', level, languageId],
    queryFn: () =>
      coursesApi.list({
        ...(level ? { level } : {}),
        ...(languageId ? { language_id: languageId } : {}),
      }),
  });
  const { data: languages } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languagesApi.list(),
  });

  const setLanguage = (id: number | null) => {
    const next = new URLSearchParams(searchParams);
    if (id == null) next.delete('language');
    else next.set('language', String(id));
    setSearchParams(next, { replace: true });
  };

  const activeLanguage = languages?.find((l) => l.id === languageId) ?? null;

  const levels = useMemo(() => {
    const set = new Set<string>();
    courses?.forEach((c) => c.level && set.add(c.level));
    return Array.from(set).sort();
  }, [courses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 animate-fade-in-up">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {activeLanguage
              ? `${activeLanguage.flag ? activeLanguage.flag + ' ' : ''}${activeLanguage.name}`
              : t('courses.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('courses.subtitle')}
          </p>
        </div>
        {levels.length > 0 && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setLevel('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                level === ''
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t('courses.allLevels')}
            </button>
            {levels.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  level === l
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Languages filter */}
      {languages && languages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1 animate-fade-in-up stagger-1">
          <button
            onClick={() => setLanguage(null)}
            className={`flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              languageId === null
                ? 'border-transparent bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                : 'border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-500'
            }`}
          >
            <span className="text-base">🌐</span>
            <span className="text-sm font-bold">
              {t('courses.allLanguages')}
            </span>
          </button>
          {languages.map((l) => {
            const grad = courseGradient(l.color, l.code);
            const active = languageId === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLanguage(l.id)}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all hover:-translate-y-0.5 ${
                  active
                    ? `border-transparent bg-gradient-to-r ${grad} text-white shadow-md`
                    : 'border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-500'
                }`}
              >
                <span className="text-base">
                  {l.flag || l.code.toUpperCase().slice(0, 2)}
                </span>
                <span className="text-sm font-bold">{l.name}</span>
                <span
                  className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                    active
                      ? 'bg-white/25'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {l.courses_count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-5 animate-fade-in-up stagger-${(i % 6) + 1}`}
            >
              <div className="h-28 rounded-xl skeleton-shimmer mb-4" />
              <div className="h-4 w-2/3 rounded skeleton-shimmer mb-2" />
              <div className="h-3 w-1/2 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!courses || courses.length === 0) && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-12 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-400 mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">{t('courses.empty')}</p>
        </div>
      )}

      {!isLoading && courses && courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => (
            <CourseCard
              key={c.id}
              course={c}
              index={i}
              gradient={courseGradient(c.cover_color, c.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  index,
  gradient,
}: {
  course: Course;
  index: number;
  gradient: string;
}) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/courses/${course.id}`}
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl animate-fade-in-up stagger-${(index % 6) + 1}`}
    >
      <div className={`relative h-32 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-2xl group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative h-full p-4 flex flex-col justify-between text-white">
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </span>
            {course.level && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/25 backdrop-blur-sm">
                {course.level}
              </span>
            )}
          </div>
          <div className="text-[11px] uppercase tracking-widest font-semibold text-white/85">
            {course.source_lang.toUpperCase()} → {course.target_lang.toUpperCase()}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {course.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-700">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <path d="M2 7l10-5 10 5-10 5L2 7z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="font-semibold">{course.decks_count}</span>
            <span className="text-slate-400">{t('courses.decks')}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="font-semibold">{course.stories_count}</span>
            <span className="text-slate-400">{t('courses.stories')}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
