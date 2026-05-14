import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { coursesApi, type CourseCreatePayload } from '@/api/courses';
import { languagesApi } from '@/api/languages';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { COURSE_COLOR_OPTIONS, courseGradient } from '@/features/courses/courseGradient';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export function AdminCourseFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editingId = id ? Number(id) : null;
  const qc = useQueryClient();

  const { data: languages } = useQuery({
    queryKey: ['languages-all'],
    queryFn: () => languagesApi.list({ all: true }),
  });

  const { data: course } = useQuery({
    queryKey: ['course-detail', editingId],
    queryFn: () => coursesApi.get(editingId!),
    enabled: editingId !== null,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('A2');
  const [topic, setTopic] = useState('');
  const [colorKey, setColorKey] = useState<string>(COURSE_COLOR_OPTIONS[0].key);
  const [languageId, setLanguageId] = useState<number | null>(null);
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description ?? '');
      setLevel(course.level ?? 'A2');
      setTopic(course.topic ?? '');
      setColorKey(course.cover_color ?? COURSE_COLOR_OPTIONS[0].key);
      setLanguageId(course.language_id ?? null);
      setIsPublished(course.is_published);
    }
  }, [course]);

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: CourseCreatePayload = {
        title,
        description: description || null,
        level: level || null,
        topic: topic || null,
        cover_color: colorKey,
        is_published: isPublished,
        language_id: languageId,
      };
      return editingId ? coursesApi.update(editingId, payload) : coursesApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      navigate('/admin?tab=courses');
    },
  });

  const canSave = title.trim().length > 0;
  const gradient = courseGradient(colorKey);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin?tab=courses')}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <div>
            <h1 className="text-xl font-bold">
              {editingId ? t('admin.courses.editTitle') : t('admin.courses.newTitle')}
            </h1>
            <p className="text-xs text-slate-500">{t('admin.courses.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 space-y-4">
          <Input
            label={t('admin.courses.field.title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('admin.courses.field.titlePh')}
          />

          <Textarea
            label={t('admin.courses.field.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t('admin.courses.field.descriptionPh')}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('admin.courses.field.level')}</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="input cursor-pointer"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <Input
              label={t('admin.courses.field.topic')}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('admin.courses.field.topicPh')}
            />
          </div>

          <div>
            <label className="label">{t('admin.courses.field.language')}</label>
            <select
              value={languageId ?? ''}
              onChange={(e) => setLanguageId(e.target.value ? Number(e.target.value) : null)}
              className="input cursor-pointer"
            >
              <option value="">— {t('admin.courses.field.noLanguage')} —</option>
              {languages?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.flag ? `${l.flag} ` : ''}{l.name} ({l.code.toUpperCase()})
                </option>
              ))}
            </select>
            {(!languages || languages.length === 0) && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                {t('admin.courses.field.noLanguagesHint')}
              </p>
            )}
          </div>

          <div>
            <label className="label">{t('admin.courses.field.cover')}</label>
            <div className="grid grid-cols-6 gap-2">
              {COURSE_COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setColorKey(opt.key)}
                  className={`relative h-10 rounded-lg bg-gradient-to-br ${opt.gradient} transition-all duration-200 hover:scale-105 ${
                    colorKey === opt.key ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-slate-800 scale-105' : ''
                  }`}
                  aria-label={opt.key}
                >
                  {colorKey === opt.key && (
                    <span className="absolute inset-0 flex items-center justify-center text-white">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div>
              <div className="text-sm font-medium">{t('admin.courses.field.published')}</div>
              <div className="text-xs text-slate-500">{t('admin.courses.field.publishedHint')}</div>
            </div>
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                isPublished ? 'bg-gradient-to-r from-primary-500 to-violet-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              onClick={() => setIsPublished(!isPublished)}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isPublished ? 'translate-x-6' : 'translate-x-1'}`} />
            </span>
          </label>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin?tab=courses')}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            {t('common.cancel')}
          </button>
          <Button onClick={() => saveMut.mutate()} disabled={!canSave || saveMut.isPending}>
            {saveMut.isPending && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {editingId ? t('admin.courses.saveEdit') : t('admin.courses.saveNew')}
          </Button>
        </div>
      </div>
    </div>
  );
}
