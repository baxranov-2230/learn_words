import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { storiesApi } from '@/api/stories';
import { lessonsApi } from '@/api/lessons';
import { coursesApi } from '@/api/courses';

export function StoryQuizPage() {
  const { id } = useParams();
  const storyId = Number(id);
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson') ? Number(searchParams.get('lesson')) : null;
  const courseId = searchParams.get('course') ? Number(searchParams.get('course')) : null;
  
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['story-quiz', storyId],
    queryFn: () => storiesApi.quiz(storyId),
    enabled: !!storyId,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [storyId]);

  const attemptMutation = useMutation({
    mutationFn: (scorePct: number) => {
      if (!lessonId) return Promise.resolve(null);
      return lessonsApi.attempt(lessonId, scorePct);
    },
    onSuccess: () => {
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] });
      }
    }
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);

  useEffect(() => {
    if (finished && quiz?.questions.length) {
      const scorePct = Math.round((score / quiz.questions.length) * 100);
      attemptMutation.mutate(scorePct);
    }
  }, [finished, quiz?.questions.length, score]);

  const handleBackClick = (to: string) => {
    if (finished) {
      navigate(to);
    } else {
      setExitTarget(to);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center animate-pulse text-emerald-600 font-bold tracking-wide">
        {t('common.loading', 'Yuklanmoqda...')}
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <p className="text-slate-500 mb-4">{t('stories.empty')}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          {t('common.back')}
        </button>
      </div>
    );
  }

  if (finished) {
    const scorePct = Math.round((score / quiz.questions.length) * 100);
    const passed = attemptMutation.data?.passed ?? (scorePct >= 70); // fallback if no lesson
    
    return (
      <div className="max-w-2xl mx-auto mt-8 sm:mt-12 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border-2 border-green-500/50 shadow-xl shadow-green-500/10 text-center animate-scale-in">
        <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full ${passed ? 'bg-green-100 dark:bg-green-500/20 text-green-500' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-500'} flex items-center justify-center mb-4 sm:mb-5`}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="sm:w-10 sm:h-10">
            {passed ? (
              <polyline points="20 6 9 17 4 12" />
            ) : (
              <line x1="18" y1="6" x2="6" y2="18" />
            )}
            {!passed && <line x1="6" y1="6" x2="18" y2="18" />}
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold mb-2 text-slate-900 dark:text-white">
          {passed ? t('games.passedTitle', 'Tabriklaymiz!') : t('games.failedTitle', 'Yana harakat qilib ko\'ring!')}
        </h3>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-2">
          Natijangiz: <span className={`font-black text-xl sm:text-2xl ml-1 ${passed ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>{score} / {quiz.questions.length}</span> ({scorePct}%)
        </p>
        
        {lessonId && (
          <p className="text-sm font-semibold mb-6 text-slate-500">
            {passed 
              ? "Keyingi dars ochildi!" 
              : "Keyingi darsni ochish uchun kamida 70% to'plashingiz kerak."}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setCurrentIdx(0);
              setScore(0);
              setFinished(false);
              setSelectedOpt(null);
            }}
            className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-sm"
          >
            Qayta urinish
          </button>
          {lessonId && courseId ? (
            <Link
              to={`/courses/${courseId}/lessons/${lessonId}`}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:-translate-y-0.5 transition-all shadow-md shadow-green-500/20"
            >
              Darsga qaytish
            </Link>
          ) : (
            <button onClick={() => navigate(-1)} className="btn-primary">
              Orqaga
            </button>
          )}
        </div>
      </div>
    );
  }

  const q = quiz.questions[currentIdx];

  const handleAnswer = (opt: string) => {
    if (selectedOpt) return;
    setSelectedOpt(opt);
    if (opt === q.correct) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      setSelectedOpt(null);
      if (currentIdx + 1 < quiz.questions.length) {
        setCurrentIdx(currentIdx + 1);
      } else {
        setFinished(true);
      }
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto mt-4 sm:mt-8 p-5 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in-up relative overflow-hidden">
      <div className="absolute top-0 left-0 h-1.5 bg-slate-100 dark:bg-slate-700 w-full z-10">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${(currentIdx / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Breadcrumbs */}
      {course && lesson && (
        <div className="mb-6 sm:mb-8 mt-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-2 flex items-center gap-2">
          <button
            onClick={() => handleBackClick(`/courses/${courseId}/lessons/${lessonId}`)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-green-600 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <nav className="flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 overflow-hidden">
            <button
              onClick={() => handleBackClick('/courses')}
              className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
            >
              {t('nav.courses')}
            </button>
            <Sep />
            <button
              onClick={() => handleBackClick(`/courses/${courseId}`)}
              className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors truncate max-w-[80px] sm:max-w-[120px]"
            >
              {course.title}
            </button>
            <Sep />
            <button
              onClick={() => handleBackClick(`/courses/${courseId}/lessons/${lessonId}`)}
              className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors truncate max-w-[100px] sm:max-w-[150px]"
            >
              {lesson.title}
            </button>
          </nav>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <button
          onClick={() => handleBackClick(lessonId && courseId ? `/courses/${courseId}/lessons/${lessonId}` : '/stories')}
          className="text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-extrabold text-sm sm:text-base tabular-nums border border-green-200 dark:border-green-500/20 shadow-sm">
          {currentIdx + 1} / {quiz.questions.length}
        </div>
      </div>

      <div className="text-center mb-8 sm:mb-10">
        <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{q.word}</div>
        <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">so'zining to'g'ri ma'nosini toping</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {q.options.map((opt, i) => {
          let btnClass = "p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-center sm:text-left font-bold text-sm sm:text-base transition-all duration-200 focus:outline-none ";
          if (!selectedOpt) {
            btnClass += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 hover:shadow-md hover:-translate-y-0.5 text-slate-700 dark:text-slate-200";
          } else {
            if (opt === q.correct) {
              btnClass += "border-green-500 bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 shadow-sm z-10 transform scale-[1.02]";
            } else if (opt === selectedOpt) {
              btnClass += "border-rose-500 bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 shadow-sm";
            } else {
              btnClass += "border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 opacity-60";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={!!selectedOpt}
              className={btnClass}
            >
              {opt}
              {selectedOpt && opt === q.correct && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-2 float-right sm:float-none mt-0.5 sm:mt-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {selectedOpt && opt === selectedOpt && opt !== q.correct && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-2 float-right sm:float-none mt-0.5 sm:mt-0">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {/* Exit Confirmation Modal */}
      {exitTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setExitTarget(null)}
        >
          <div
            className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
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
              Imtihonni tark etasizmi?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Imtihon tugamadi. Chiqsangiz, natijangiz saqlanmaydi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setExitTarget(null)}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Davom etish
              </button>
              <button
                onClick={() => {
                  setExitTarget(null);
                  navigate(exitTarget!);
                }}
                className="flex-1 px-4 py-3 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/30"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sep() {
  return (
    <span className="text-slate-300 dark:text-slate-700">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </span>
  );
}

