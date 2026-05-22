import type { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'flat';
}

export function Card({ className = '', children, variant = 'default', ...rest }: Props) {
  const base = variant === 'flat' ? 'card-flat' : 'card';
  return (
    <div className={`${base} p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}
