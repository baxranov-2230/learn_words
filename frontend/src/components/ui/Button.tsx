import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'xp';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'btn-3d-primary',
  secondary: 'btn-3d-neutral',
  ghost: 'btn-3d-ghost',
  danger: 'btn-3d-danger',
  success: 'btn-3d-success',
  warning: 'btn-3d-warning',
  xp: 'btn-3d-xp',
};

const sizeClasses: Record<Size, string> = {
  sm: 'btn-3d-sm',
  md: '',
  lg: 'btn-3d-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
