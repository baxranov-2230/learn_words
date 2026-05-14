import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '@/api/courses';
import { lessonsApi } from '@/api/lessons';
import { courseGradient } from './courseGradient';
import type { LessonStatus } from '@/types';

type LessonState = 'locked' | 'pending' | 'inprogress' | 'passed';

function lessonState(l: LessonStatus): LessonState {
  if (l.passed) return 'passed';
  if (l.locked) return 'locked';
  if (l.attempts > 0) return 'inprogress';
  return 'pending';
}

const STATE_STYLES: Record<
  LessonState,
  {
    ring: string;
    chip: string;
    bar: string;
    badge: string;
    icon: string;
    border: string;
  }
> = {
  locked: {
    ring: 'ring-rose-500/20',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    bar: 'from-rose-500 to-pink-500',
    badge: 'bg-rose-500',
    icon: 'from-rose-500 to-pink-600',
    border: 'border-rose-200 dark:border-rose-500/30',
  },
  pending: {
    ring: 'ring-rose-500/20',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    bar: 'from-rose-500 to-pink-500',
    badge: 'bg-rose-500',
    icon: 'from-rose-500 to-pink-600',
    border: 'border-rose-200 dark:border-rose-500/30',
  },
  inprogress: {
    ring: 'ring-amber-500/30',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    bar: 'from-amber-400 to-orange-500',
    badge: 'bg-amber-500',
    icon: 'from-amber-500 to-orange-600',
    border: 'border-amber-200 dark:border-amber-500/30',
  },
  passed: {
    ring: 'ring-emerald-500/30',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    bar: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-500',
    icon: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200 dark:border-emerald-500/30',
  },
};

export function CourseDetailPage() {
  const { id } = useParams();
  const courseId = Number(id);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.get(courseId),
    enabled: !!courseId,
  });
  const { data: lessons } = useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: () => lessonsApi.list(courseId),
    enabled: !!courseId,
  });
  const { data: progress } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => lessonsApi.progress(courseId),
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 rounded-2xl skeleton-shimmer" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-12 text-center">
        <p className="text-slate-500">404</p>
      </div>
    );
  }

  const gradient = courseGradient(course.cover_color, course.title);
  const percent = progress?.percent ?? 0;
  const totalLessons = progress?.total_lessons ?? lessons?.length ?? 0;
  const passedLessons = progress?.passed_lessons ?? 0;

  const onLessonClick = (l: LessonStatus) => {
    if (l.locked) return;
    navigate(`/courses/${courseId}/lessons/${l.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br ${gradient} p-6 sm:p-8 lg:p-10 text-white animate-fade-in-up`}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/15 blur-3xl animate-float-slow" />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-float-slow"
          style={{ animationDelay: '3s' }}
        />
        <div className="relative max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium hover:bg-white/25 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {t('courses.title')}
            </Link>
            {course.level && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/25 backdrop-blur-sm">
                {course.level}
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm uppercase tracking-widest">
              {course.source_lang} → {course.target_lang}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-sm sm:text-base text-white/90 leading-relaxed">
              {course.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="pt-2 space-y-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest font-semibold text-white/80">
                  {t('courses.progress')}
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold tabular-nums">
                  {percent}
                  <span className="text-base font-bold text-white/85">%</span>
                </div>
              </div>
              <div className="text-xs text-white/85 pb-1">
                {passedLessons} / {totalLessons} {t('courses.lessons')}
              </div>
            </div>
            <div className="h-3 rounded-full bg-white/15 backdrop-blur-sm overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lessons */}
      <section className="space-y-3 animate-fade-in-up stagger-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 text-white shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </span>
            {t('courses.sectionLessons')}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
            {lessons?.length ?? 0}
          </span>
        </div>

        {(!lessons || lessons.length === 0) && (
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-400 mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">{t('courses.emptyLessons')}</p>
          </div>
        )}

        {lessons && lessons.length > 0 && (
          <ol className="space-y-3">
            {lessons.map((l, i) => (
              <LessonRow
                key={l.id}
                lesson={l}
                index={i}
                onClick={() => onLessonClick(l)}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function LessonRow({
  lesson,
  index,
  onClick,
}: {
  lesson: LessonStatus;
  index: number;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const state = lessonState(lesson);
  const styles = STATE_STYLES[state];
  const score = lesson.best_score;
  const target = lesson.passing_score;
  const fillPct = Math.min(100, Math.round((score / Math.max(1, target)) * 100));

  return (
    <li
      className={`relative animate-fade-in-up stagger-${(index % 6) + 1}`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={state === 'locked'}
        className={`group relative w-full overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border ${styles.border} text-left transition-all duration-300 ${
          state === 'locked'
            ? 'opacity-75 cursor-not-allowed'
            : 'hover:-translate-y-0.5 hover:shadow-lg'
        }`}
      >
        {/* Left status stripe */}
        <span
          className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${styles.bar}`}
        />

        <div className="p-4 sm:p-5 pl-5 sm:pl-6 flex items-center gap-3 sm:gap-4">
          {/* Order/status icon */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${styles.icon} text-white flex items-center justify-center shadow-md ring-4 ${styles.ring} transition-transform duration-300 group-hover:scale-110`}
            >
              {state === 'locked' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ) : state === 'passed' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="text-base font-extrabold">{lesson.position + 1 || index + 1}</span>
              )}
            </div>
            <span
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${styles.badge} ring-2 ring-white dark:ring-slate-800`}
            />
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t('courses.lessonNum', { n: index + 1 })}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${styles.chip}`}
              >
                {t(`courses.state.${state}`)}
              </span>
              {lesson.attempts > 0 && (
                <span className="text-[10px] font-semibold text-slate-500">
                  · {t('courses.attemptsCount', { n: lesson.attempts })}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-base mt-0.5 truncate">
              {lesson.title}
            </h3>
            {lesson.attempts > 0 && (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${styles.bar} transition-all duration-500`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {score}
                  <span className="text-slate-400">/{target}%</span>
                </span>
              </div>
            )}
          </div>

          {/* CTA arrow */}
          <div className="flex-shrink-0">
            {state === 'locked' ? (
              <span className="text-slate-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
            ) : (
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-primary-500 group-hover:text-white group-hover:scale-110 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
