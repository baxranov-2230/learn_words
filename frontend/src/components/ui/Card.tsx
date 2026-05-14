import type { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = '', children, ...rest }: Props) {
  return (
    <div className={`card p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}
