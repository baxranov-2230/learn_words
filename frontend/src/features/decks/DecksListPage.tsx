import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { decksApi } from '@/api/decks';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

export function DecksListPage() {
  const { t } = useTranslation();
  const [scope, setScope] = useState<'mine' | 'public'>('mine');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['decks', scope, search],
    queryFn: () => decksApi.list({ scope, search: search || undefined, page_size: 50 }),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{t('decks.title')}</h1>
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <button
            className={`px-4 py-2 text-sm ${scope === 'mine' ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            onClick={() => setScope('mine')}
          >
            {t('decks.mine')}
          </button>
          <button
            className={`px-4 py-2 text-sm ${scope === 'public' ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            onClick={() => setScope('public')}
          >
            {t('decks.public')}
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Input
            placeholder={t('decks.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Link to="/decks/new" className="btn-primary">
            + {t('decks.create')}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <Card className="text-center py-12 text-slate-500">{t('decks.empty')}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((d) => (
            <Link key={d.id} to={`/decks/${d.id}`}>
              <Card className="hover:shadow-md transition cursor-pointer h-full">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{d.title}</h3>
                {d.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                    {d.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{d.source_lang.toUpperCase()} → {d.target_lang.toUpperCase()}</span>
                  {d.level && <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{d.level}</span>}
                  <span className="ml-auto">
                    {t('decks.cardsCount', { count: d.cards_count })}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
