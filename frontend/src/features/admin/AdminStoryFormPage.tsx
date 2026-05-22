import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { storiesApi } from '@/api/stories';
import { adminApi } from '@/api/admin';
import { cardsApi } from '@/api/decks';
import { coursesApi } from '@/api/courses';
import { uploadApi } from '@/api/upload';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

interface WordRow {
  word: string;
  translation: string;
  note?: string;
}

type DeckMode = 'new' | 'existing';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 cursor-pointer ${
        checked ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-slate-300 dark:bg-slate-600'
      }`}
      onClick={() => onChange(!checked)}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </span>
  );
}

export function AdminStoryFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editingId = id ? Number(id) : null;
  const qc = useQueryClient();

  const { data: decks } = useQuery({
    queryKey: ['admin-decks'],
    queryFn: () => adminApi.decks({ page_size: 200 }),
  });
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list(),
  });
  const { data: existingStory } = useQuery({
    queryKey: ['story-detail', editingId],
    queryFn: () => storiesApi.get(editingId!),
    enabled: editingId !== null,
  });

  const courseMap = useMemo(() => {
    const map = new Map<number, string>();
    courses?.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [courses]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [level, setLevel] = useState('A2');
  const [topic, setTopic] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [deckMode, setDeckMode] = useState<DeckMode>('new');
  const [existingDeckId, setExistingDeckId] = useState<number | null>(null);
  const [deckIsPublic, setDeckIsPublic] = useState(true);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [words, setWords] = useState<WordRow[]>([{ word: '', translation: '' }]);

  useEffect(() => {
    if (existingStory) {
      setTitle(existingStory.title);
      setContent(existingStory.content);
      setLevel(existingStory.level ?? 'A2');
      setTopic(existingStory.topic ?? '');
      setIsPublished(existingStory.is_published);
      setCourseId(existingStory.course_id ?? null);
      setExistingDeckId(existingStory.deck_id ?? null);
      setAudioUrl(existingStory.audio_url ?? null);
      setDeckMode('existing');
      setWords(
        existingStory.words.length > 0
          ? existingStory.words.map((w) => ({ word: w.word, translation: w.translation, note: w.note ?? undefined }))
          : [{ word: '', translation: '' }],
      );
    }
  }, [existingStory]);

  const importDeckWordsMut = useMutation({
    mutationFn: (id: number) => cardsApi.list(id),
    onSuccess: (cards) => {
      if (!cards.length) return;
      setWords(cards.map((c) => ({ word: c.term, translation: c.definition, note: c.example ?? undefined })));
    },
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const cleanWords = words
        .filter((w) => w.word && w.translation)
        .map((w, i) => ({ word: w.word, translation: w.translation, note: w.note, position_in_text: i }));
      if (editingId) {
        return storiesApi.updateAdmin(editingId, {
          title, content, audio_url: audioUrl, level: level || null, topic: topic || null,
          is_published: isPublished, deck_id: existingDeckId, course_id: courseId, words: cleanWords,
        });
      }
      const isNew = deckMode === 'new';
      return storiesApi.createAdmin({
        title, content, audio_url: audioUrl, level: level || undefined, topic: topic || undefined,
        is_published: isPublished, deck_id: isNew ? null : existingDeckId,
        auto_create_deck: isNew, deck_is_public: deckIsPublic,
        course_id: courseId, source_lang: 'en', target_lang: 'uz', words: cleanWords,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['admin-decks'] });
      qc.invalidateQueries({ queryKey: ['decks'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      navigate('/admin?tab=stories');
    },
  });

  const updateWord = (idx: number, patch: Partial<WordRow>) =>
    setWords((arr) => arr.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  const addWord = () => setWords((arr) => [...arr, { word: '', translation: '' }]);
  const removeWord = (idx: number) =>
    setWords((arr) => (arr.length === 1 ? arr : arr.filter((_, i) => i !== idx)));

  const wordsCount = words.filter((w) => w.word && w.translation).length;
  const canSave =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    (editingId !== null || deckMode === 'new' || existingDeckId !== null) &&
    wordsCount > 0;

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadApi.uploadAudio(file);
      setAudioUrl(res.audio_url);
    } catch (error) {
      console.error('Failed to upload audio', error);
      alert(t('common.error'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin?tab=stories')}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-sm flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-white shadow-md ${editingId ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          <div>
            <h1 className="text-xl font-bold">
              {editingId ? t('admin.stories.editTitle') : t('admin.stories.newTitle')}
            </h1>
            <p className="text-xs text-slate-500">
              {editingId ? t('admin.stories.editSubtitle') : t('admin.stories.newSubtitle')}
            </p>
          </div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200 font-semibold border border-primary-200/50 dark:border-primary-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
          {wordsCount} {t('admin.stories.words')}
        </span>
      </div>

      {/* Form card */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 space-y-4">
          <Input
            label={t('admin.stories.field.title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('admin.stories.field.titlePh')}
          />

          <div className="space-y-1.5">
            <label className="label">Audio ({t('common.optional', 'Ixtiyoriy')})</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                disabled={isUploading}
                className="input cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {isUploading && <span className="text-sm text-slate-500 animate-pulse">{t('common.uploading', 'Yuklanmoqda...')}</span>}
            </div>
            {audioUrl && (
              <div className="mt-3 p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-green-500 text-white shadow-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">
                      Audio biriktirildi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('decks.deleteConfirm'))) {
                        setAudioUrl(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold text-lives-600 hover:bg-lives-50 dark:text-lives-400 dark:hover:bg-lives-500/10 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    {t('common.delete')}
                  </button>
                </div>
                <audio src={audioUrl || undefined} controls className="w-full h-8" />
              </div>
            )}
          </div>

          <Textarea
            label={t('admin.stories.field.content')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={7}
            placeholder={t('admin.stories.field.contentPh')}
          />

          {/* Course selector */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-primary-50 dark:bg-primary-500/10 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-md">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </span>
              <div>
                <div className="text-sm font-bold">{t('admin.stories.courseTitle')}</div>
                <div className="text-xs text-slate-500">{t('admin.stories.courseHint')}</div>
              </div>
            </div>
            <div className="p-4">
              <select
                value={courseId ?? ''}
                onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : null)}
                className="input cursor-pointer"
              >
                <option value="">— {t('admin.stories.noCourse')} —</option>
                {courses?.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}{c.level ? ` · ${c.level}` : ''}</option>
                ))}
              </select>
              {courseId && (
                <p className="text-xs text-primary-700 dark:text-primary-300 mt-2 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('admin.stories.courseLinked', { title: courseMap.get(courseId) ?? '' })}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('admin.stories.field.level')}</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="input cursor-pointer">
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <Input
              label={t('admin.stories.field.topic')}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('admin.stories.field.topicPh')}
            />
          </div>

          {/* Deck selector */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-primary-50 dark:bg-primary-500/10 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7l10-5 10 5-10 5L2 7z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </span>
              <div>
                <div className="text-sm font-bold">{t('admin.stories.deckTitle')}</div>
                <div className="text-xs text-slate-500">
                  {editingId ? t('admin.stories.deckEditHint') : t('admin.stories.deckHint')}
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {!editingId && (
                <div className="grid grid-cols-2 gap-2">
                  {(['new', 'existing'] as DeckMode[]).map((mode) => {
                    const active = deckMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDeckMode(mode)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                          active
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${active ? 'border-primary-600 bg-primary-600' : 'border-slate-300 dark:border-slate-600'}`}>
                          {active && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <div>
                          <div className="text-sm font-semibold">
                            {t(mode === 'new' ? 'admin.stories.modeNew' : 'admin.stories.modeExisting')}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {t(mode === 'new' ? 'admin.stories.modeNewHint' : 'admin.stories.modeExistingHint')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {(editingId !== null || deckMode === 'existing') && (
                <div className="flex gap-2">
                  <select
                    value={existingDeckId ?? ''}
                    onChange={(e) => setExistingDeckId(e.target.value ? Number(e.target.value) : null)}
                    className="input flex-1 cursor-pointer"
                  >
                    <option value="">— {t('admin.stories.pickDeck')} —</option>
                    {decks?.map((d) => (
                      <option key={d.id} value={d.id}>{d.title} · {d.cards_count} {t('admin.stories.cards')}</option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={!existingDeckId || importDeckWordsMut.isPending}
                    onClick={() => existingDeckId && importDeckWordsMut.mutate(existingDeckId)}
                  >
                    {importDeckWordsMut.isPending ? t('common.loading') : t('admin.stories.importDeckWords')}
                  </Button>
                </div>
              )}

              {!editingId && deckMode === 'new' && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-sm font-medium">{t('admin.stories.deckPublic')}</div>
                    <div className="text-xs text-slate-500">{t('admin.stories.deckPublicHint')}</div>
                  </div>
                  <Toggle checked={deckIsPublic} onChange={setDeckIsPublic} />
                </div>
              )}
            </div>
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-sm font-medium">{t('admin.stories.field.published')}</div>
              <div className="text-xs text-slate-500">{t('admin.stories.field.publishedHint')}</div>
            </div>
            <Toggle checked={isPublished} onChange={setIsPublished} />
          </div>

          {/* Words */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('admin.stories.wordsTitle')}
              </h3>
              <Button variant="secondary" type="button" onClick={addWord}>
                + {t('admin.stories.addWord')}
              </Button>
            </div>
            <div className="space-y-2">
              {words.map((w, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    className="input flex-1 min-w-0 py-1.5"
                    placeholder={t('admin.stories.wordPh')}
                    value={w.word}
                    onChange={(e) => updateWord(idx, { word: e.target.value })}
                  />
                  <input
                    className="input flex-1 min-w-0 py-1.5"
                    placeholder={t('admin.stories.translationPh')}
                    value={w.translation}
                    onChange={(e) => updateWord(idx, { translation: e.target.value })}
                  />
                  <input
                    className="input flex-[1.3] min-w-0 py-1.5 hidden sm:block"
                    placeholder={t('admin.stories.notePh')}
                    value={w.note ?? ''}
                    onChange={(e) => updateWord(idx, { note: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeWord(idx)}
                    disabled={words.length === 1}
                    className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-lives-50 hover:text-lives-600 dark:hover:bg-lives-500/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    aria-label="remove"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin?tab=stories')}
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
            {saveMut.isPending
              ? t('common.loading')
              : editingId
              ? t('admin.stories.saveEdit')
              : deckMode === 'new'
              ? t('admin.stories.saveBundle')
              : t('admin.stories.saveLinked')}
          </Button>
        </div>
      </div>
    </div>
  );
}
