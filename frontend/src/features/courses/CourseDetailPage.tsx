import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '@/api/courses';
import { lessonsApi } from '@/api/lessons';
import { courseGradient } from './courseGradient';
import type { LessonStatus } from '@/types';

type LessonState = 'locked' | 'pending' | 'inprogress' | 'passed' | 'current';

function lessonState(l: LessonStatus, idx: number, lessons: LessonStatus[]): LessonState {
  if (l.passed) return 'passed';
  if (l.locked) return 'locked';
  if (l.attempts > 0) return 'inprogress';
  const firstActive = lessons.findIndex((x) => !x.locked && !x.passed);
  if (idx === firstActive) return 'current';
  return 'pending';
}

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
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-52 rounded-3xl skeleton-shimmer" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />
        ))}
      </div>
    );
  }

  if (!course) {
    return <div className="card p-12 text-center"><p className="text-slate-500 font-bold">404</p></div>;
  }

  const gradient = courseGradient(course.cover_color, course.title);
  const percent = progress?.percent ?? 0;
  const totalLessons = progress?.total_lessons ?? lessons?.length ?? 0;
  const passedLessons = progress?.passed_lessons ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Hero */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 sm:p-8 text-white animate-fade-in-up shadow-xl`}>
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-extrabold hover:bg-white/30 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {t('courses.title')}
            </Link>
            {course.level && (
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-xl bg-white/25">{course.level}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{course.title}</h1>
          {course.description && (
            <p className="text-sm font-medium text-white/85 leading-relaxed">{course.description}</p>
          )}
          {/* Progress */}
          <div className="pt-1 space-y-1.5">
            <div className="flex justify-between text-xs font-extrabold text-white/85">
              <span>{passedLessons} / {totalLessons} {t('courses.lessons')}</span>
              <span>{percent}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white/80 rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Lessons list */}
      {(!lessons || lessons.length === 0) ? (
        <div className="card p-12 text-center border-dashed">
          <p className="text-sm font-bold text-slate-400">{t('courses.emptyLessons')}</p>
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in-up stagger-2">
          {lessons.map((l, i) => {
            const state = lessonState(l, i, lessons);
            return (
              <LessonCard
                key={l.id}
                lesson={l}
                index={i}
                state={state}
                onClick={() => { if (!l.locked) navigate(`/courses/${courseId}/lessons/${l.id}`); }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

const STATE_CONFIG: Record<LessonState, {
  bg: string;
  border: string;
  numBg: string;
  numText: string;
  badge: string;
  badgeText: string;
  label: string;
}> = {
  passed: {
    bg: 'bg-white dark:bg-slate-900 hover:bg-success-50 dark:hover:bg-success-900/10',
    border: 'border-success-200 dark:border-success-800',
    numBg: 'bg-success-500',
    numText: 'text-white',
    badge: 'bg-success-100 dark:bg-success-900/30',
    badgeText: 'text-success-700 dark:text-success-400',
    label: "O'tilgan",
  },
  current: {
    bg: 'bg-white dark:bg-slate-900 hover:bg-primary-50 dark:hover:bg-primary-900/10',
    border: 'border-primary-400 dark:border-primary-600',
    numBg: 'bg-primary-500',
    numText: 'text-white',
    badge: 'bg-primary-100 dark:bg-primary-900/30',
    badgeText: 'text-primary-700 dark:text-primary-400',
    label: 'Joriy',
  },
  inprogress: {
    bg: 'bg-white dark:bg-slate-900 hover:bg-streak-50 dark:hover:bg-streak-900/10',
    border: 'border-streak-300 dark:border-streak-700',
    numBg: 'bg-streak-500',
    numText: 'text-white',
    badge: 'bg-streak-100 dark:bg-streak-900/30',
    badgeText: 'text-streak-700 dark:text-streak-400',
    label: 'Davom etmoqda',
  },
  pending: {
    bg: 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    numBg: 'bg-slate-200 dark:bg-slate-700',
    numText: 'text-slate-500 dark:text-slate-400',
    badge: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-500 dark:text-slate-400',
    label: "Kutmoqda",
  },
  locked: {
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    border: 'border-slate-200 dark:border-slate-800',
    numBg: 'bg-slate-200 dark:bg-slate-700',
    numText: 'text-slate-400 dark:text-slate-500',
    badge: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-400 dark:text-slate-500',
    label: 'Qulflangan',
  },
};

function LessonCard({
  lesson,
  index,
  state,
  onClick,
}: {
  lesson: LessonStatus;
  index: number;
  state: LessonState;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const cfg = STATE_CONFIG[state];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'locked'}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 text-left
        ${cfg.bg} ${cfg.border}
        ${state !== 'locked' ? 'cursor-pointer active:scale-[0.99]' : 'cursor-not-allowed opacity-60'}
        ${state === 'current' ? 'shadow-md shadow-primary-100 dark:shadow-primary-900/20' : ''}
      `}
    >
      {/* Number circle */}
      <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-base ${cfg.numBg} ${cfg.numText} transition-transform duration-200`}>
        {state === 'passed' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : state === 'locked' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ) : (
          index + 1
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
            {lesson.title}
          </span>
          {state === 'current' && (
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg ${cfg.badge} ${cfg.badgeText}`}>
              {t('courses.start', 'Boshlash')} →
            </span>
          )}
          {state === 'passed' && lesson.best_score > 0 && (
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${cfg.badge} ${cfg.badgeText}`}>
              {lesson.best_score}%
            </span>
          )}
          {state === 'inprogress' && (
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg ${cfg.badge} ${cfg.badgeText}`}>
              {lesson.attempts}× urinish
            </span>
          )}
        </div>
        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
          {t('courses.lessonNum', { n: index + 1 })} · {cfg.label}
        </div>
      </div>

      {/* Arrow */}
      {state !== 'locked' && (
        <svg className="flex-shrink-0 text-slate-300 dark:text-slate-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );
}
