import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { progressApi } from '@/api/progress';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function StatsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['progress-me'],
    queryFn: progressApi.me,
  });

  if (isLoading) return <Skeleton className="h-40" />;

  const total = data?.total_cards ?? 0;
  const mastered = data?.mastered ?? 0;
  const learning = data?.learning ?? 0;
  const fresh = Math.max(0, total - mastered - learning);
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.stats')}</h1>

      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Tile label={t('progress.totalCards')} value={total} />
          <Tile label={t('progress.mastered')} value={mastered} />
          <Tile label={t('progress.learning')} value={learning} />
          <Tile label={t('progress.streak')} value={`${data?.current_streak ?? 0}🔥`} />
        </div>

        <div className="space-y-3">
          <Bar label={t('progress.mastered')} pct={pct(mastered)} color="bg-green-500" />
          <Bar label={t('progress.learning')} pct={pct(learning)} color="bg-yellow-500" />
          <Bar label="New" pct={pct(fresh)} color="bg-slate-400" />
        </div>
      </Card>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-slate-500">{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
