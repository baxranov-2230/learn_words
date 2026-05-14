interface Props {
  className?: string;
}

export function Skeleton({ className = '' }: Props) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`} />
  );
}
