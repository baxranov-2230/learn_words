import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '@/api/courses';
import { lessonsApi } from '@/api/lessons';

interface Props {
  gameKey: 'flashcards' | 'test' | 'match' | 'spelling' | 'scramble' | 'gravity';
  /** O'yin hali tugamagan bo'lsa true — orqaga borishda modal chiqadi */
  isGameActive?: boolean;
}

const GAME_GRADIENTS: Record<Props['gameKey'], string> = {
  flashcards: 'from-emerald-500 to-teal-600',
  test: 'from-primary-500 via-primary-500 to-sky-500',
  match: 'from-sky-500 to-blue-600',
  spelling: 'from-amber-500 to-orange-600',
  scramble: 'from-streak-500 to-lives-500',
  gravity: 'from-violet-500 to-purple-600',
};

export function GameBreadcrumb({ gameKey, isGameActive = false }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const lessonRaw = params.get('lesson');
  const courseRaw = params.get('course');
  const lessonId = lessonRaw ? Number(lessonRaw) : null;
  const courseId = courseRaw ? Number(courseRaw) : null;

  const [showModal, setShowModal] = useState(false);
  const [exitTarget, setExitTarget] = useState<string | null>(null);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.get(courseId!),
    enabled: !!courseId,
  });
  const { data: lessons } = useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: () => lessonsApi.list(courseId!),
    enabled: !!courseId,
  });
  const lesson = lessons?.find((l) => l.id === lessonId) ?? null;

  if (!courseId || !lessonId) return null;

  const backTo = `/courses/${courseId}/lessons/${lessonId}`;

  const handleBack = (target: string) => {
    if (isGameActive) {
      setExitTarget(target);
      setShowModal(true);
    } else {
      navigate(target);
    }
  };

  return (
    <>
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 animate-fade-in-up shadow-sm">
        {/* Back button */}
        <button
          onClick={() => handleBack(backTo)}
          title={t('lesson.backToLesson')}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-500 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        {/* Crumbs */}
        <nav
          aria-label="breadcrumb"
          className="flex-1 min-w-0 flex items-center gap-1 text-xs sm:text-sm overflow-hidden"
        >
          <button
            onClick={() => handleBack('/courses')}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium flex-shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {t('nav.courses')}
          </button>

          <Sep className="hidden sm:inline" />

          <button
            onClick={() => handleBack(`/courses/${courseId}`)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium max-w-[120px] sm:max-w-[160px] truncate"
          >
            <span className="truncate">{course?.title ?? '...'}</span>
          </button>

          <Sep />

          <button
            onClick={() => handleBack(backTo)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium max-w-[140px] sm:max-w-[200px] truncate"
          >
            <span className="truncate">
              {lesson?.title ?? `${t('courses.lessons')}…`}
            </span>
          </button>

          <Sep />

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-[11px] sm:text-xs font-bold bg-gradient-to-r ${GAME_GRADIENTS[gameKey]} shadow-sm flex-shrink-0`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
            {t(`games.${gameKey}`)}
          </span>
        </nav>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 text-center mb-2">
              {t('games.exitTitle', "O'yinni tark etasizmi?")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              {t('games.exitDesc', "O'yin tugamadi. Chiqsangiz, natija saqlanmaydi.")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {t('games.continueGame', "Davom etish")}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  navigate(exitTarget || backTo);
                }}
                className="flex-1 px-4 py-3 rounded-2xl bg-lives-500 text-white font-bold text-sm hover:bg-lives-600 transition-colors shadow-md shadow-lives-500/30"
              >
                {t('games.exitGame', "Chiqish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Sep({ className = '' }: { className?: string }) {
  return (
    <span
      className={`text-slate-300 dark:text-slate-600 select-none ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </span>
  );
}

export function useLessonContext() {
  const [params] = useSearchParams();
  const lessonRaw = params.get('lesson');
  const courseRaw = params.get('course');
  const lessonId = lessonRaw ? Number(lessonRaw) : null;
  const courseId = courseRaw ? Number(courseRaw) : null;
  return {
    lessonId,
    courseId,
    backToLessonPath:
      courseId && lessonId
        ? `/courses/${courseId}/lessons/${lessonId}`
        : null,
    replayPath: (deckId: number, mode: string) =>
      lessonId && courseId
        ? `/decks/${deckId}/play/${mode}?lesson=${lessonId}&course=${courseId}`
        : `/decks/${deckId}/play/${mode}`,
  };
}
