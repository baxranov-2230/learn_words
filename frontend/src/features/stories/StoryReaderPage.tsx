import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { storiesApi } from '@/api/stories';
import { coursesApi } from '@/api/courses';
import { lessonsApi } from '@/api/lessons';
import { useSessionStore } from '@/store/sessionStore';

type FontSize = 'sm' | 'md' | 'lg';

const FONT_CLASS: Record<FontSize, string> = {
  sm: 'text-base sm:text-base leading-relaxed',
  md: 'text-base sm:text-lg leading-[1.85]',
  lg: 'text-lg sm:text-xl leading-[1.9]',
};

interface TooltipData {
  word: string;
  translation: string;
  note?: string | null;
  image_url?: string | null;
  x: number;
  y: number;
}

export function StoryReaderPage() {
  const { id } = useParams();
  const storyId = Number(id);
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();
  const lessonIdStr = searchParams.get('lesson');
  const courseIdStr = searchParams.get('course');
  const lessonId = lessonIdStr ? Number(lessonIdStr) : null;
  const courseId = courseIdStr ? Number(courseIdStr) : null;
  
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [readPct, setReadPct] = useState(0);
  const [exitTarget, setExitTarget] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const setSessionActive = useSessionStore((s) => s.setSessionActive);

  useEffect(() => {
    setSessionActive(true);
    return () => setSessionActive(false);
  }, [setSessionActive]);

  const handleBackClick = (to: string) => {
    setExitTarget(to);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [storyId]);

  const { data: story, isLoading: isStoryLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => storiesApi.get(storyId),
    enabled: !!storyId,
  });

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

  const lesson = useMemo(() => {
    if (!lessons || !lessonId) return null;
    return lessons.find(l => l.id === lessonId) || null;
  }, [lessons, lessonId]);

  // Close tooltip on outside click / escape
  useEffect(() => {
    if (!tooltip) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setTooltip(null);
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('[data-tooltip]') && !el.closest('[data-word]'))
        setTooltip(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, [tooltip]);

  // Reading progress (scroll-based)
  useEffect(() => {
    if (!story) return;
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setReadPct(100);
        return;
      }
      const scrolled = Math.max(0, -rect.top);
      const pct = Math.min(100, Math.max(0, Math.round((scrolled / total) * 100)));
      setReadPct(pct);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [story]);

  const wordMap = useMemo(() => {
    if (!story) return new Map();
    return new Map(story.words.map((w) => [w.word.toLowerCase(), w]));
  }, [story]);

  const stats = useMemo(() => {
    if (!story) return { words: 0, readMinutes: 0 };
    const words = story.content.trim().split(/\s+/).length;
    const readMinutes = Math.max(1, Math.round(words / 180));
    return { words, readMinutes };
  }, [story]);

  if (isStoryLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-44 rounded-2xl skeleton-shimmer" />
        <div className="h-96 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-12 text-center">
        <p className="text-slate-500">404</p>
      </div>
    );
  }

  const renderToken = (token: string, key: string) => {
    const cleaned = token.replace(/[.,!?;:()"'""]/g, '').toLowerCase();
    const w = wordMap.get(cleaned);
    if (w) {
      return (
        <span
          key={key}
          data-word
          className="relative inline cursor-pointer text-primary-700 dark:text-primary-300 font-semibold rounded-md px-0.5 -mx-0.5 hover:bg-primary-100 dark:hover:bg-primary-500/20 hover:shadow-sm transition-colors decoration-primary-400/60 decoration-2 decoration-dotted underline underline-offset-4"
          onClick={(e) => {
            e.stopPropagation();
            setTooltip({
              word: w.word,
              translation: w.translation,
              note: w.note,
              image_url: w.image_url,
              x: e.clientX,
              y: e.clientY,
            });
          }}
        >
          {token}
        </span>
      );
    }
    return <span key={key}>{token}</span>;
  };

  const tokens = story.content.split(/(\s+)/);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-slate-200/40 dark:bg-slate-800/40">
        <div
          className="h-full bg-gradient-to-r from-primary-400 via-primary-500 to-lives-500 transition-all duration-200"
          style={{ width: `${readPct}%` }}
        />
      </div>

      {/* Back button + Breadcrumb — above the hero card */}
      {course && lesson ? (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 animate-fade-in-up shadow-sm">
          <button
            onClick={() => handleBackClick(`/courses/${course.id}/lessons/${lesson.id}`)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-500 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <nav className="flex-1 min-w-0 flex flex-wrap items-center gap-1 text-xs sm:text-sm overflow-hidden" aria-label="breadcrumb">
            <button
              onClick={() => handleBackClick('/courses')}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium flex-shrink-0"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {t('nav.courses', 'Kurslar')}
            </button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:inline text-slate-300 dark:text-slate-600">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <button
              onClick={() => handleBackClick(`/courses/${course.id}`)}
              className="inline-flex items-center px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium max-w-[100px] sm:max-w-[160px] truncate"
            >
              <span className="truncate">{course.title}</span>
            </button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <button
              onClick={() => handleBackClick(`/courses/${course.id}/lessons/${lesson.id}`)}
              className="inline-flex items-center px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium max-w-[120px] sm:max-w-[180px] truncate"
            >
              <span className="truncate">{lesson.title}</span>
            </button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-[11px] sm:text-xs font-bold bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
              {story.title}
            </span>
          </nav>
        </div>
      ) : (
        <div className="flex items-center gap-2 animate-fade-in-up">
          <button
            onClick={() => handleBackClick('/stories')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t('stories.title', 'Hikoyalar')}
          </button>
        </div>
      )}



      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-500 via-primary-500 to-lives-500 text-white p-5 sm:p-7 lg:p-8 animate-fade-in-up">
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/15 blur-3xl animate-float-slow" />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-3xl animate-float-slow"
          style={{ animationDelay: '4s' }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {!course && !lesson && (
              <Link
                to="/stories"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium hover:bg-white/25 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                {t('stories.title')}
              </Link>
            )}
            {story.level && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/25 backdrop-blur-sm">
                {story.level}
              </span>
            )}
            {story.topic && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                {story.topic}
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm uppercase tracking-widest">
              {story.source_lang} → {story.target_lang}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {story.title}
          </h1>

          {/* Meta stats */}
          <div className="flex flex-wrap gap-4 sm:gap-6 mt-4 text-sm">
            <Stat
              label={t('reader.words')}
              value={String(stats.words)}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7V4h16v3" />
                  <path d="M9 20h6" />
                  <path d="M12 4v16" />
                </svg>
              }
            />
            <Stat
              label={t('reader.readingTime')}
              value={`${stats.readMinutes} ${t('reader.minutes')}`}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
            />
            <Stat
              label={t('reader.keyWords')}
              value={String(story.words.length)}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {/* Reading toolbar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest">
          {t('reader.readPct', { n: readPct })}
        </div>
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          {(['sm', 'md', 'lg'] as FontSize[]).map((s) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-extrabold transition-all ${
                fontSize === s
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              } ${
                s === 'sm' ? 'text-[11px]' : s === 'md' ? 'text-sm' : 'text-base'
              }`}
              aria-label={`font-${s}`}
            >
              A
            </button>
          ))}
        </div>
      </div>

      {/* Article */}
      <article
        ref={articleRef}
        className="relative rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-5 sm:p-8 lg:p-12 animate-fade-in-up stagger-1"
      >
        {/* Decorative quote mark */}
        <span className="absolute top-4 right-5 text-7xl sm:text-9xl text-primary-100 dark:text-primary-500/10 font-serif leading-none select-none pointer-events-none">
          &ldquo;
        </span>
        
        {story.audio_url && <CustomAudioPlayer src={story.audio_url} />}

        <div
          className={`relative font-serif text-slate-800 dark:text-slate-100 max-w-prose mx-auto whitespace-pre-wrap ${FONT_CLASS[fontSize]}`}
          style={{ fontFamily: '"Georgia", "Iowan Old Style", "Times New Roman", serif' }}
        >
          {tokens.map((tok, i) =>
            tok.match(/^\s+$/)
              ? <span key={i}>{tok}</span>
              : renderToken(tok, String(i))
          )}
        </div>

        {/* Footer hint */}
        <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 text-center">
          {t('reader.tapToTranslate')}
        </div>
      </article>

      {/* Key words list */}
      {story.words.length > 0 && (
        <section className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up stagger-2">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6.253v13M5 19h7a4 4 0 0 1 4-4V4a4 4 0 0 0-4-4H5z" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base sm:text-lg">
                {t('reader.keyWordsTitle')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('reader.keyWordsHint')}
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
              {story.words.length}
            </span>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 sm:divide-y-0 sm:grid sm:grid-cols-2 sm:gap-px sm:divide-x sm:bg-slate-100 sm:dark:bg-slate-800">
            {story.words.map((w, i) => (
              <li
                key={w.id}
                className={`px-4 sm:px-5 py-3 flex items-start gap-3 bg-white dark:bg-slate-800 hover:bg-primary-50/50 dark:hover:bg-primary-500/5 transition-colors animate-fade-in-up stagger-${(i % 6) + 1}`}
              >
                <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 mt-1 tabular-nums w-6 flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {w.image_url && (
                  <img
                    src={w.image_url}
                    alt={w.word}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {w.word}
                  </div>
                  <div className="text-sm text-primary-700 dark:text-primary-300 font-medium mt-0.5">
                    {w.translation}
                  </div>
                  {w.note && (
                    <div className="text-xs text-slate-500 mt-1 italic">
                      {w.note}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tooltip */}
      {tooltip && <WordTooltip data={tooltip} onClose={() => setTooltip(null)} />}

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
              <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 dark:text-primary-400">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 text-center mb-2">
              {t('reader.exitTitle', "Hikoyadan chiqasizmi?")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              {t('reader.exitDesc', "O'qishni to'xtatib chiqmoqchimisiz?")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setExitTarget(null)}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {t('reader.continueReading', "Davom etish")}
              </button>
              <button
                onClick={() => navigate(exitTarget)}
                className="flex-1 px-4 py-3 rounded-2xl bg-lives-500 text-white font-bold text-sm hover:bg-lives-600 transition-colors shadow-md shadow-lives-500/30"
              >
                {t('reader.exitConfirm', "Chiqish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const setAudioData = () => {
      setDuration(audio.duration);
    };
    
    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnded);
    
    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = (val / 100) * duration;
      setProgress(val);
      setCurrentTime((val / 100) * duration);
    }
  };

  const changeSpeed = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSpeed = Number(e.target.value);
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-primary-50/50 dark:from-slate-800 dark:to-slate-800/80 border border-primary-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-400/20 to-primary-500/20 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
      
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="relative z-10 flex items-center gap-3 sm:gap-5">
        <button
          onClick={togglePlay}
          className="flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="translate-x-0.5">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </button>

        <div className="flex-1 flex flex-col justify-center gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="relative flex items-center h-5 cursor-pointer group/slider">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden relative z-10 pointer-events-none shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Slider thumb */}
            <div 
              className="absolute h-4 w-4 bg-white border-[3px] border-primary-500 rounded-full shadow-md z-10 pointer-events-none transition-transform group-hover/slider:scale-125"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>
        </div>

        <div className="relative">
          <select
            value={speed}
            onChange={changeSpeed}
            title="Play speed"
            className="appearance-none flex-shrink-0 min-w-[4.5rem] h-10 pl-3 pr-7 rounded-xl bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-primary-200/50 dark:border-slate-600 text-sm font-bold text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2.0x</option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-primary-700 dark:text-primary-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
        {icon}
      </span>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/75 font-semibold">
          {label}
        </div>
        <div className="text-sm font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function WordTooltip({
  data,
  onClose,
}: {
  data: TooltipData;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({
    left: data.x,
    top: data.y,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 12;
    let left = data.x + 12;
    let top = data.y + 16;
    if (left + rect.width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (top + rect.height > window.innerHeight - margin) {
      top = Math.max(margin, data.y - rect.height - 16);
    }
    setPos({ left, top });
  }, [data]);

  return (
    <div
      ref={ref}
      data-tooltip
      className="fixed z-50 max-w-xs animate-scale-in"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-primary-200 dark:border-primary-500/30 shadow-2xl shadow-slate-900/15 dark:shadow-black/40 overflow-hidden">
        <div className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white flex items-center justify-between gap-2">
          <span className="font-bold text-sm truncate">{data.word}</span>
          <button
            onClick={onClose}
            aria-label="close"
            className="inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {data.image_url && (
          <img
            src={data.image_url}
            alt={data.word}
            className="w-full h-32 object-cover"
          />
        )}
        <div className="p-3.5 space-y-1.5">
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {data.translation}
          </div>
          {data.note && (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
              {data.note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
