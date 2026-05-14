import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { languagesApi, type LanguageCreatePayload } from '@/api/languages';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { COURSE_COLOR_OPTIONS, courseGradient } from '@/features/courses/courseGradient';

export function AdminLanguageFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editingId = id ? Number(id) : null;
  const qc = useQueryClient();

  const { data: languages } = useQuery({
    queryKey: ['languages-all'],
    queryFn: () => languagesApi.list({ all: true }),
  });

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [flag, setFlag] = useState('');
  const [colorKey, setColorKey] = useState<string>(COURSE_COLOR_OPTIONS[0].key);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (editingId && languages) {
      const l = languages.find((x) => x.id === editingId);
      if (l) {
        setCode(l.code);
        setName(l.name);
        setNativeName(l.native_name ?? '');
        setFlag(l.flag ?? '');
        setColorKey(l.color ?? COURSE_COLOR_OPTIONS[0].key);
        setIsActive(l.is_active);
      }
    }
  }, [editingId, languages]);

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: LanguageCreatePayload = {
        code: code.trim().toLowerCase(),
        name,
        native_name: nativeName || null,
        flag: flag || null,
        color: colorKey,
        is_active: isActive,
      };
      return editingId
        ? languagesApi.update(editingId, payload)
        : languagesApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['languages-all'] });
      qc.invalidateQueries({ queryKey: ['languages'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      navigate('/admin?tab=languages');
    },
  });

  const canSave = code.trim().length >= 2 && name.trim().length > 0;
  const gradient = courseGradient(colorKey);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin?tab=languages')}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md text-lg font-extrabold`}>
            {flag || (code ? code.toUpperCase().slice(0, 2) : '🌐')}
          </span>
          <div>
            <h1 className="text-xl font-bold">
              {editingId ? t('admin.languages.editTitle') : t('admin.languages.newTitle')}
            </h1>
            <p className="text-xs text-slate-500">{t('admin.languages.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Input
                label={t('admin.languages.code')}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^a-z]/gi, '').slice(0, 5))}
                placeholder="en"
              />
            </div>
            <div className="col-span-2">
              <Input
                label={t('admin.languages.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="English"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label={t('admin.languages.nativeName')}
                value={nativeName}
                onChange={(e) => setNativeName(e.target.value)}
                placeholder="English"
              />
            </div>
            <Input
              label={t('admin.languages.flag')}
              value={flag}
              onChange={(e) => setFlag(e.target.value.slice(0, 4))}
              placeholder="🇬🇧"
            />
          </div>

          <div>
            <label className="label">{t('admin.languages.color')}</label>
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
              <div className="text-sm font-medium">{t('admin.languages.active')}</div>
              <div className="text-xs text-slate-500">{t('admin.languages.activeHint')}</div>
            </div>
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              onClick={() => setIsActive(!isActive)}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </span>
          </label>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin?tab=languages')}
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
            {editingId ? t('admin.languages.saveEdit') : t('admin.languages.saveNew')}
          </Button>
        </div>
      </div>
    </div>
  );
}
