import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cardsApi, decksApi } from '@/api/decks';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { CardCreate } from '@/types';

interface CardRow extends CardCreate {
  _id?: number; // existing card id
}

export function DeckEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const deckId = id ? Number(id) : null;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('uz');
  const [level, setLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [rows, setRows] = useState<CardRow[]>([{ term: '', definition: '', position: 0 }]);
  const [saving, setSaving] = useState(false);

  const deckQ = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => decksApi.get(deckId!),
    enabled: !!deckId,
  });
  const cardsQ = useQuery({
    queryKey: ['cards', deckId],
    queryFn: () => cardsApi.list(deckId!),
    enabled: !!deckId,
  });

  useEffect(() => {
    if (deckQ.data) {
      setTitle(deckQ.data.title);
      setDescription(deckQ.data.description ?? '');
      setSourceLang(deckQ.data.source_lang);
      setTargetLang(deckQ.data.target_lang);
      setLevel(deckQ.data.level ?? '');
      setTopic(deckQ.data.topic ?? '');
      setIsPublic(deckQ.data.is_public);
    }
  }, [deckQ.data]);

  useEffect(() => {
    if (cardsQ.data && cardsQ.data.length) {
      setRows(
        cardsQ.data.map((c) => ({
          _id: c.id,
          term: c.term,
          definition: c.definition,
          transcription: c.transcription ?? '',
          example: c.example ?? '',
          position: c.position,
        }))
      );
    }
  }, [cardsQ.data]);

  const updateRow = (idx: number, patch: Partial<CardRow>) => {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };
  const addRow = () =>
    setRows((r) => [...r, { term: '', definition: '', position: r.length }]);
  const removeRow = (idx: number) => setRows((r) => r.filter((_, i) => i !== idx));

  const onSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title,
        description: description || undefined,
        source_lang: sourceLang,
        target_lang: targetLang,
        level: level || undefined,
        topic: topic || undefined,
        is_public: isPublic,
      };
      let savedId = deckId!;
      if (isNew) {
        const created = await decksApi.create(payload);
        savedId = created.id;
      } else {
        await decksApi.update(deckId!, payload);
      }

      const existing = (cardsQ.data ?? []).map((c) => c.id);
      const keptIds = rows.filter((r) => r._id).map((r) => r._id!);
      const toDelete = existing.filter((eid) => !keptIds.includes(eid));
      const newRows = rows.filter((r) => !r._id && (r.term || r.definition));
      const toUpdate = rows.filter((r) => r._id);

      for (const id of toDelete) await cardsApi.remove(id);
      for (const r of toUpdate) {
        await cardsApi.update(r._id!, {
          term: r.term,
          definition: r.definition,
          transcription: r.transcription || undefined,
          example: r.example || undefined,
          position: r.position,
        });
      }
      if (newRows.length) {
        await cardsApi.bulkCreate(savedId, newRows);
      }

      qc.invalidateQueries({ queryKey: ['decks'] });
      qc.invalidateQueries({ queryKey: ['deck', savedId] });
      qc.invalidateQueries({ queryKey: ['cards', savedId] });
      navigate(`/decks/${savedId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        {isNew ? t('decks.create') : t('decks.edit')}
      </h1>
      <Card className="space-y-4">
        <Input
          label={t('decks.form.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          label={t('decks.form.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            label={t('decks.form.sourceLang')}
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
          />
          <Input
            label={t('decks.form.targetLang')}
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
          />
          <Input
            label={t('decks.form.level')}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="A1, A2, B1..."
          />
          <Input
            label={t('decks.form.topic')}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          {t('decks.form.isPublic')}
        </label>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">
            {t('decks.cardsCount', { count: rows.length })}
          </h2>
          <Button variant="secondary" onClick={addRow} type="button">
            + {t('decks.card.addCard')}
          </Button>
        </div>
        <div className="space-y-2">
          {rows.map((r, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-start"
            >
              <Input
                placeholder={t('decks.card.term')}
                value={r.term}
                onChange={(e) => updateRow(idx, { term: e.target.value })}
              />
              <Input
                placeholder={t('decks.card.definition')}
                value={r.definition}
                onChange={(e) => updateRow(idx, { definition: e.target.value })}
              />
              <Button variant="ghost" type="button" onClick={() => removeRow(idx)}>
                ×
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          {t('common.cancel')}
        </Button>
        <Button onClick={onSave} disabled={saving || !title}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
