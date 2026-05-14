import { forwardRef, type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className = '', ...rest },
  ref
) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input ref={ref} className={`input ${className}`} {...rest} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});
