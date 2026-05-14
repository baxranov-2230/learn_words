import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn bg-red-600 text-white hover:bg-red-700',
};

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button className={`${variantClasses[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
