import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { storiesApi } from '@/api/stories';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useState } from 'react';

const LEVELS = ['', 'A1', 'A2', 'B1', 'B2', 'C1'];

export function StoriesListPage() {
  const { t } = useTranslation();
  const [level, setLevel] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['stories', level],
    queryFn: () => storiesApi.list({ level: level || undefined }),
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl font-bold">{t('stories.title')}</h1>
        <div className="ml-auto flex items-center gap-1">
          {LEVELS.map((l) => (
            <button
              key={l || 'all'}
              onClick={() => setLevel(l)}
              className={`px-3 py-1 rounded-md text-sm ${level === l ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {l || 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !data?.length ? (
        <Card className="text-center py-12 text-slate-500">{t('stories.empty')}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((s) => (
            <Link key={s.id} to={`/stories/${s.id}`}>
              <Card className="hover:shadow-md transition cursor-pointer h-full">
                <h3 className="font-semibold text-lg mb-1">{s.title}</h3>
                <div className="flex gap-2 text-xs text-slate-500">
                  {s.level && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                      {s.level}
                    </span>
                  )}
                  {s.topic && <span>{s.topic}</span>}
                  <span className="ml-auto">
                    {s.source_lang.toUpperCase()} → {s.target_lang.toUpperCase()}
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
