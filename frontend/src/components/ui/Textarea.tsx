import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, className = '', ...rest },
  ref
) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea ref={ref} className={`input min-h-[80px] ${className}`} {...rest} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});
