import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cardsApi, decksApi } from '@/api/decks';
import { storiesApi } from '@/api/stories';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';

export function DeckDetailPage() {
  const { id } = useParams();
  const deckId = Number(id);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: deck, isLoading: deckLoading } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => decksApi.get(deckId),
    enabled: !!deckId,
  });
  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ['cards', deckId],
    queryFn: () => cardsApi.list(deckId),
    enabled: !!deckId,
  });
  const { data: linkedStories } = useQuery({
    queryKey: ['stories', 'by-deck', deckId],
    queryFn: () => storiesApi.list({ deck_id: deckId }),
    enabled: !!deckId,
  });

  const cloneMut = useMutation({
    mutationFn: () => decksApi.clone(deckId),
    onSuccess: (d) => navigate(`/decks/${d.id}`),
  });
  const deleteMut = useMutation({
    mutationFn: () => decksApi.remove(deckId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decks'] });
      navigate('/decks');
    },
  });

  if (deckLoading) return <Skeleton className="h-32" />;
  if (!deck) return <Card>404</Card>;

  const isOwner = user?.id === deck.user_id;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{deck.title}</h1>
            {deck.description && (
              <p className="text-slate-600 dark:text-slate-400 mt-1">{deck.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span>
                {deck.source_lang.toUpperCase()} → {deck.target_lang.toUpperCase()}
              </span>
              {deck.level && (
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                  {deck.level}
                </span>
              )}
              {deck.is_public && (
                <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200">
                  Public
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/decks/${deck.id}/play`} className="btn-primary">
              ▶ {t('decks.play')}
            </Link>
            {isOwner ? (
              <>
                <Link to={`/decks/${deck.id}/edit`} className="btn-secondary">
                  {t('decks.edit')}
                </Link>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm(t('decks.deleteConfirm'))) deleteMut.mutate();
                  }}
                >
                  {t('decks.delete')}
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => cloneMut.mutate()}>
                {t('decks.clone')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {linkedStories && linkedStories.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </span>
              {t('decks.linkedStories')}
            </h2>
            <span className="text-xs text-slate-500">{linkedStories.length}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {linkedStories.map((s) => (
              <Link
                key={s.id}
                to={`/stories/${s.id}`}
                className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate group-hover:text-primary-600 transition-colors">
                    {s.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {s.level && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {s.level}
                      </span>
                    )}
                    {s.topic && (
                      <span className="text-xs text-slate-500 truncate">{s.topic}</span>
                    )}
                  </div>
                </div>
                <svg className="text-slate-400 group-hover:text-primary-500 transition-colors flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold mb-3">
          {t('decks.cardsCount', { count: cards?.length ?? 0 })}
        </h2>
        {cardsLoading ? (
          <Skeleton className="h-40" />
        ) : !cards?.length ? (
          <p className="text-slate-500">—</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {cards.map((c) => (
              <li key={c.id} className="py-2 flex items-start gap-4">
                <span className="font-medium flex-1">{c.term}</span>
                <span className="text-slate-600 dark:text-slate-400 flex-1">
                  {c.definition}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
