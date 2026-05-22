import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';
import { adminApi } from '@/api/admin';
import { decksApi } from '@/api/decks';
import { storiesApi } from '@/api/stories';
import { lessonsApi } from '@/api/lessons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { courseGradient } from '@/features/courses/courseGradient';

interface Props {
  courseId: number;
  onBack: () => void;
}

export function CourseManagePanel({ courseId, onBack }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-manage', courseId],
    queryFn: () => coursesApi.manage(courseId),
  });
  const { data: allDecks } = useQuery({
    queryKey: ['admin-decks'],
    queryFn: () => adminApi.decks({ page_size: 500 }),
  });
  const { data: allStories } = useQuery({
    queryKey: ['admin-stories-all'],
    queryFn: () => adminApi.stories(),
  });

  const [tab, setTab] = useState<'lessons' | 'decks' | 'stories'>('lessons');
  const [deckPickerOpen, setDeckPickerOpen] = useState(false);
  const [storyPickerOpen, setStoryPickerOpen] = useState(false);

  const { data: lessons } = useQuery({
    queryKey: ['course-lessons-admin', courseId],
    queryFn: () => lessonsApi.list(courseId),
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['course-manage', courseId] });
    qc.invalidateQueries({ queryKey: ['courses'] });
    qc.invalidateQueries({ queryKey: ['admin-decks'] });
    qc.invalidateQueries({ queryKey: ['admin-stories-all'] });
    qc.invalidateQueries({ queryKey: ['stories'] });
    qc.invalidateQueries({ queryKey: ['course-lessons-admin', courseId] });
    qc.invalidateQueries({ queryKey: ['course-lessons', courseId] });
    qc.invalidateQueries({ queryKey: ['course-progress', courseId] });
  };

  const createLessonMut = useMutation({
    mutationFn: (data: {
      title: string;
      passing_score: number;
      position: number;
      deck_id?: number | null;
      story_id?: number | null;
    }) => lessonsApi.create(courseId, data),
    onSuccess: invalidateAll,
  });

  const updateLessonMut = useMutation({
    mutationFn: (args: {
      id: number;
      data: { passing_score?: number; position?: number; title?: string };
    }) => lessonsApi.update(args.id, args.data),
    onSuccess: invalidateAll,
  });

  const removeLessonMut = useMutation({
    mutationFn: (id: number) => lessonsApi.remove(id),
    onSuccess: invalidateAll,
  });

  const attachDeckMut = useMutation({
    mutationFn: (deckId: number) =>
      decksApi.update(deckId, { course_id: courseId, is_public: true }),
    onSuccess: invalidateAll,
  });

  const detachDeckMut = useMutation({
    mutationFn: (deckId: number) =>
      decksApi.update(deckId, { course_id: null }),
    onSuccess: invalidateAll,
  });

  const attachStoryMut = useMutation({
    mutationFn: (storyId: number) =>
      storiesApi.updateAdmin(storyId, {
        course_id: courseId,
        is_published: true,
      }),
    onSuccess: invalidateAll,
  });

  const detachStoryMut = useMutation({
    mutationFn: (storyId: number) =>
      storiesApi.updateAdmin(storyId, { course_id: null }),
    onSuccess: invalidateAll,
  });

  const publishDeckMut = useMutation({
    mutationFn: (deckId: number) =>
      decksApi.update(deckId, { is_public: true }),
    onSuccess: invalidateAll,
  });

  const publishStoryMut = useMutation({
    mutationFn: (storyId: number) =>
      storiesApi.updateAdmin(storyId, { is_published: true }),
    onSuccess: invalidateAll,
  });

  const availableDecks = useMemo(() => {
    if (!allDecks) return [];
    return allDecks.filter(
      (d) => d.course_id == null || d.course_id !== courseId,
    );
  }, [allDecks, courseId]);

  const availableStories = useMemo(() => {
    if (!allStories) return [];
    return allStories.filter(
      (s) => s.course_id == null || s.course_id !== courseId,
    );
  }, [allStories, courseId]);

  if (isLoading || !course) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 animate-fade-in">
        <div className="h-32 rounded-xl skeleton-shimmer" />
      </div>
    );
  }

  const gradient = courseGradient(course.cover_color, course.title);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Hero header */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 sm:p-6 text-white`}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/15 blur-3xl animate-float-slow" />
        <div className="relative space-y-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium hover:bg-white/25 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t('admin.courses.backToList')}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                {course.title}
              </h2>
              {course.description && (
                <p className="text-sm text-white/85 mt-1 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {course.level && (
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                  {course.level}
                </span>
              )}
              {!course.is_published && (
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-300/30 backdrop-blur-sm">
                  {t('admin.stories.draft')}
                </span>
              )}
              <Link
                to={`/courses/${course.id}`}
                title={t('admin.courses.preview')}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1 gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-thin">
        <TabButton
          active={tab === 'lessons'}
          onClick={() => setTab('lessons')}
          gradient="from-primary-500 via-primary-500 to-primary-500"
          count={lessons?.length ?? 0}
          label={t('admin.courses.tabLessons')}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          }
        />
        <TabButton
          active={tab === 'decks'}
          onClick={() => setTab('decks')}
          gradient="from-emerald-500 to-teal-600"
          count={course.decks.length}
          label={t('admin.courses.tabDecks')}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7l10-5 10 5-10 5L2 7z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          }
        />
        <TabButton
          active={tab === 'stories'}
          onClick={() => setTab('stories')}
          gradient="from-amber-500 to-orange-600"
          count={course.stories.length}
          label={t('admin.courses.tabStories')}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        />
      </div>

      {tab === 'lessons' && (
        <LessonsTab
          courseDecks={course.decks}
          courseStories={course.stories}
          lessons={lessons ?? []}
          onCreate={(d) =>
            createLessonMut.mutate({
              ...d,
              position: lessons?.length ?? 0,
            })
          }
          onUpdate={(id, data) => updateLessonMut.mutate({ id, data })}
          onRemove={(id) => removeLessonMut.mutate(id)}
          isPending={createLessonMut.isPending}
        />
      )}

      {/* Decks tab */}
      {tab === 'decks' && (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-base">
                {t('admin.courses.attachedDecks')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('admin.courses.attachedDecksHint')}
              </p>
            </div>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDeckPickerOpen((v) => !v)}
              disabled={availableDecks.length === 0}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('admin.courses.addDeck')}
            </Button>
          </div>

          {/* Picker */}
          {deckPickerOpen && (
            <div className="px-4 sm:px-5 py-3 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/20 animate-fade-in-up">
              {availableDecks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {t('admin.courses.noAvailableDecks')}
                </p>
              ) : (
                <ul className="grid gap-1.5 sm:grid-cols-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {availableDecks.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => {
                          attachDeckMut.mutate(d.id);
                          setDeckPickerOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 7l10-5 10 5-10 5L2 7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{d.title}</div>
                          <div className="text-xs text-slate-500">
                            {d.cards_count} {t('admin.stories.cards')}
                            {d.course_id != null && d.course_id !== courseId && (
                              <span className="ml-1.5 text-amber-600 dark:text-amber-400">
                                · {t('admin.courses.inOtherCourse')}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Attached list */}
          {course.decks.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 text-emerald-600 dark:text-emerald-400 mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7l10-5 10 5-10 5L2 7z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">
                {t('admin.courses.emptyDecks')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {course.decks.map((d, i) => (
                <li
                  key={d.id}
                  className={`px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors animate-fade-in-up stagger-${(i % 6) + 1}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7l10-5 10 5-10 5L2 7z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/decks/${d.id}`}
                      className="font-semibold truncate block hover:text-emerald-600 transition-colors"
                    >
                      {d.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {d.cards_count} {t('admin.stories.cards')}
                      </span>
                      {d.level && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {d.level}
                        </span>
                      )}
                      {!d.is_public && (
                        <button
                          onClick={() => publishDeckMut.mutate(d.id)}
                          disabled={publishDeckMut.isPending}
                          title={t('admin.courses.makePublicHint')}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300 transition-colors"
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          {t('admin.courses.hidden')}
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(t('admin.courses.detachConfirm')))
                        detachDeckMut.mutate(d.id);
                    }}
                    title={t('admin.courses.detach')}
                    className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-lives-50 hover:text-lives-600 dark:hover:bg-lives-500/10 transition-all hover:scale-110 active:scale-95"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Stories tab */}
      {tab === 'stories' && (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-base">
                {t('admin.courses.attachedStories')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('admin.courses.attachedStoriesHint')}
              </p>
            </div>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setStoryPickerOpen((v) => !v)}
              disabled={availableStories.length === 0}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('admin.courses.addStory')}
            </Button>
          </div>

          {storyPickerOpen && (
            <div className="px-4 sm:px-5 py-3 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 animate-fade-in-up">
              {availableStories.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {t('admin.courses.noAvailableStories')}
                </p>
              ) : (
                <ul className="grid gap-1.5 sm:grid-cols-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {availableStories.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          attachStoryMut.mutate(s.id);
                          setStoryPickerOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{s.title}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            {s.level && <span>{s.level}</span>}
                            {!s.is_published && (
                              <span className="text-amber-600 dark:text-amber-400">
                                · {t('admin.stories.draft')}
                              </span>
                            )}
                            {s.course_id != null && s.course_id !== courseId && (
                              <span className="text-amber-600 dark:text-amber-400">
                                · {t('admin.courses.inOtherCourse')}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {course.stories.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/15 dark:to-orange-500/15 text-amber-600 dark:text-amber-400 mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">
                {t('admin.courses.emptyStories')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {course.stories.map((s, i) => (
                <li
                  key={s.id}
                  className={`px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors animate-fade-in-up stagger-${(i % 6) + 1}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/stories/${s.id}`}
                      className="font-semibold truncate block hover:text-amber-600 transition-colors"
                    >
                      {s.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      {s.level && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {s.level}
                        </span>
                      )}
                      {!s.is_published && (
                        <button
                          onClick={() => publishStoryMut.mutate(s.id)}
                          disabled={publishStoryMut.isPending}
                          title={t('admin.courses.publishHint')}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300 transition-colors"
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          {t('admin.stories.draft')}
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(t('admin.courses.detachConfirm')))
                        detachStoryMut.mutate(s.id);
                    }}
                    title={t('admin.courses.detach')}
                    className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-lives-50 hover:text-lives-600 dark:hover:bg-lives-500/10 transition-all hover:scale-110 active:scale-95"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function LessonsTab({
  courseDecks,
  courseStories,
  lessons,
  onCreate,
  onUpdate,
  onRemove,
  isPending,
}: {
  courseDecks: { id: number; title: string }[];
  courseStories: { id: number; title: string }[];
  lessons: import('@/types').LessonStatus[];
  onCreate: (d: {
    title: string;
    passing_score: number;
    deck_id?: number | null;
    story_id?: number | null;
  }) => void;
  onUpdate: (
    id: number,
    data: { title?: string; passing_score?: number; position?: number },
  ) => void;
  onRemove: (id: number) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [deckId, setDeckId] = useState<number | null>(null);
  const [storyId, setStoryId] = useState<number | null>(null);

  const reset = () => {
    setTitle('');
    setPassingScore(70);
    setDeckId(null);
    setStoryId(null);
  };

  const canSave = title.trim().length > 0 && (deckId !== null || storyId !== null);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Add lesson form */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-primary-50 dark:from-primary-500/10 dark:to-primary-500/10 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 via-primary-500 to-primary-500 text-white shadow-md">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          <div>
            <div className="text-sm font-bold">{t('admin.courses.addLesson')}</div>
            <div className="text-xs text-slate-500">
              {t('admin.courses.addLessonHint')}
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5 space-y-3">
          <Input
            label={t('admin.courses.lessonTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('admin.courses.lessonTitlePh')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('admin.courses.lessonDeck')}</label>
              <select
                value={deckId ?? ''}
                onChange={(e) =>
                  setDeckId(e.target.value ? Number(e.target.value) : null)
                }
                className="input cursor-pointer"
              >
                <option value="">— {t('admin.courses.noDeck')} —</option>
                {courseDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('admin.courses.lessonStory')}</label>
              <select
                value={storyId ?? ''}
                onChange={(e) =>
                  setStoryId(e.target.value ? Number(e.target.value) : null)
                }
                className="input cursor-pointer"
              >
                <option value="">— {t('admin.courses.noStory')} —</option>
                {courseStories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">
              {t('admin.courses.passingScore')}: {passingScore}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={reset}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!canSave || isPending}
              onClick={() => {
                onCreate({
                  title,
                  passing_score: passingScore,
                  deck_id: deckId,
                  story_id: storyId,
                });
                reset();
              }}
            >
              {t('admin.courses.addLesson')}
            </Button>
          </div>
        </div>
      </div>

      {/* Lessons list */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-base">
            {t('admin.courses.lessonsList')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('admin.courses.lessonsListHint')}
          </p>
        </div>
        {lessons.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-100 dark:from-primary-500/15 dark:to-primary-500/15 text-primary-600 dark:text-primary-400 mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">
              {t('admin.courses.emptyLessons')}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {lessons.map((l, i) => (
              <li
                key={l.id}
                className={`px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors animate-fade-in-up stagger-${(i % 6) + 1}`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-primary-500 to-primary-500 text-white flex items-center justify-center flex-shrink-0 shadow-md font-extrabold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{l.title}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {l.passing_score}%
                    </span>
                    {l.deck_id && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        · {t('admin.courses.tabDecks')}
                      </span>
                    )}
                    {l.story_id && (
                      <span className="text-amber-600 dark:text-amber-400">
                        · {t('admin.courses.tabStories')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {i > 0 && (
                    <button
                      onClick={() =>
                        onUpdate(l.id, { position: l.position - 1 })
                      }
                      title={t('admin.courses.moveUp')}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 transition-all"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>
                  )}
                  {i < lessons.length - 1 && (
                    <button
                      onClick={() =>
                        onUpdate(l.id, { position: l.position + 1 })
                      }
                      title={t('admin.courses.moveDown')}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 transition-all"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(t('admin.courses.deleteLessonConfirm')))
                        onRemove(l.id);
                    }}
                    title={t('common.delete')}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-lives-50 hover:text-lives-600 dark:hover:bg-lives-500/10 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  icon,
  gradient,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        active
          ? 'text-white shadow-md'
          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {active && (
        <span
          className={`absolute inset-0 rounded-lg bg-gradient-to-br ${gradient} animate-scale-in`}
        />
      )}
      <span className="relative inline-flex items-center gap-2">
        {icon}
        {label}
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            active ? 'bg-white/25' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        >
          {count}
        </span>
      </span>
    </button>
  );
}
