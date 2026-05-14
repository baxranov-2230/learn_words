import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-lg">
        {title && (
          <div className="border-b border-slate-200 dark:border-slate-700 px-5 py-3 text-lg font-semibold">
            {title}
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700 px-5 py-3">
          {footer ?? (
            <button className="btn-ghost" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
