import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { SideNav } from './SideNav';

const langs = [
  { code: 'uz', label: "O'z" },
  { code: 'ru', label: 'Ру' },
  { code: 'en', label: 'EN' },
] as const;

export function AppShell() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLocale = (code: 'uz' | 'ru' | 'en') => {
    setLocale(code);
    i18n.changeLanguage(code);
  };

  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot';

  // Auth pages: render simple shell without sidebar
  if (!user || isAuthRoute) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 text-white shadow-md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </span>
              <span className="text-lg font-extrabold tracking-tight text-gradient">
                {t('app.name')}
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher locale={locale} onChange={handleLocale} />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              {!user && (
                <>
                  <Link to="/login" className="btn-ghost">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="btn-primary">
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <SideNav mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Mobile logo */}
            <Link to="/" className="lg:hidden flex items-center gap-2 min-w-0">
              <span className="text-base font-extrabold tracking-tight text-gradient truncate">
                {t('app.name')}
              </span>
            </Link>

            <div className="flex-1" />

            <LanguageSwitcher locale={locale} onChange={handleLocale} />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function LanguageSwitcher({
  locale,
  onChange,
}: {
  locale: string;
  onChange: (c: 'uz' | 'ru' | 'en') => void;
}) {
  return (
    <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-xs bg-white dark:bg-slate-800">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          className={`px-2.5 py-1.5 font-semibold transition-all duration-200 ${
            locale === l.code
              ? 'bg-gradient-to-r from-primary-500 to-violet-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: 'light' | 'dark';
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="toggle theme"
    >
      <svg
        className={`absolute transition-all duration-500 ${
          theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
      <svg
        className={`absolute transition-all duration-500 ${
          theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
