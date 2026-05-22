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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="border-b-2 border-slate-100 dark:border-slate-800 px-6 py-4 text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {title}
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        <div className="flex justify-end gap-3 border-t-2 border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-950/40">
          {footer ?? (
            <button className="btn-3d-ghost" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
