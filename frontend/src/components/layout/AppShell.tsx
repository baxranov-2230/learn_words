import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { progressApi } from '@/api/progress';
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

  // Stats (streak / XP) — only when authed
  const { data: progress } = useQuery({
    queryKey: ['progress', 'me'],
    queryFn: () => progressApi.me(),
    enabled: !!user && !isAuthRoute,
    staleTime: 60_000,
  });
  const streak = progress?.current_streak ?? 0;
  // XP: backend doesn't expose; approximate from mastered cards * 10 for visual flavor
  const xp = (progress?.mastered ?? 0) * 10;

  // Auth pages: render simple shell without sidebar
  if (!user || isAuthRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <header className="border-b-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="text-lg font-extrabold tracking-tight text-gradient">
                {t('app.name')}
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher locale={locale} onChange={handleLocale} />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              {!user && (
                <>
                  <Link to="/login" className="btn-3d-ghost">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="btn-3d-primary">
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
        <header className="sticky top-0 z-30 border-b-2 border-slate-100 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md">
          <div className="px-4 sm:px-6 py-2.5 flex items-center gap-3">
            {/* Mobile menu */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <Link to="/" className="lg:hidden flex items-center gap-2 min-w-0">
              <BrandMark size="sm" />
              <span className="text-sm font-extrabold tracking-tight text-gradient truncate">
                {t('app.name')}
              </span>
            </Link>

            <div className="flex-1" />

            {/* Stats: streak + xp */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <StatPill kind="streak" value={streak} />
              <StatPill kind="xp" value={xp} />
              <StatPill kind="lives" value={5} hideOnXs />
            </div>

            {/* Profile dropdown */}
            <ProfileDropdown
              user={user}
              theme={theme}
              locale={locale}
              onToggleTheme={toggleTheme}
              onLocale={handleLocale}
            />
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile bottom tab bar */}
        <MobileTabBar />
      </div>
    </div>
  );
}

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const icon = size === 'sm' ? 16 : 20;
  return (
    <span className={`relative inline-flex items-center justify-center ${dim} rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-sky-500 text-white shadow-md shadow-primary-500/30`}>
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    </span>
  );
}

function StatPill({
  kind,
  value,
  hideOnXs = false,
}: {
  kind: 'streak' | 'xp' | 'lives';
  value: number;
  hideOnXs?: boolean;
}) {
  if (kind === 'streak') {
    return (
      <span className={`stat-pill-streak ${hideOnXs ? 'hidden xs:inline-flex' : ''}`}>
        <FireIcon className={value > 0 ? 'animate-flame-flicker' : 'opacity-40'} />
        <span>{value}</span>
      </span>
    );
  }
  if (kind === 'xp') {
    return (
      <span className={`stat-pill-xp ${hideOnXs ? 'hidden xs:inline-flex' : ''}`}>
        <DiamondIcon />
        <span>{value}</span>
      </span>
    );
  }
  return (
    <span className={`stat-pill-lives ${hideOnXs ? 'hidden xs:inline-flex' : ''}`}>
      <HeartIcon />
      <span>{value}</span>
    </span>
  );
}

function FireIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2s2 3 2 5.5c0 1.5-.7 2.5-1.7 3.5C13.3 12 14 11 14 9c1 1 3 3.5 3 7 0 3.31-2.69 6-6 6s-6-2.69-6-6c0-3.6 3-7 3-7 0 2 .7 3 1.7 4-1-1-1.7-2-1.7-3.5C8 4 12 2 12 2z" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 4 9l8 13 8-13-8-7zm0 2.8L17.5 9h-3.3L12 4.8zm-2.2 4.2L12 4.8 9.8 9zM6.5 9h3.2L12 19l-5.5-10zm11 0L12 19l5.5-10z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-7-4.5-9.5-9.3C.8 8.3 2.5 5 5.7 5c1.9 0 3.4 1 4.3 2.4C10.9 6 12.4 5 14.3 5c3.2 0 4.9 3.3 3.2 6.7C19 16.5 12 21 12 21z" />
    </svg>
  );
}

function MobileTabBar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const tabs: { to: string; label: string; icon: React.ReactNode }[] = [
    {
      to: '/profile',
      label: t('nav.profile'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      to: '/dashboard',
      label: t('nav.dashboard'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      to: '/courses',
      label: t('nav.courses'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      to: '/decks',
      label: t('nav.decks', 'Decks'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="3" y1="9" x2="21" y2="9" />
        </svg>
      ),
    },
    {
      to: '/stats',
      label: t('nav.stats'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
  ];
  if (!user) return null;
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-slate-100 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            {tab.icon}
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              {tab.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
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
    <div className="flex border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs bg-white dark:bg-slate-800">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          className={`px-2.5 py-1.5 font-extrabold transition-all duration-200 ${
            locale === l.code
              ? 'bg-primary-500 text-white'
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
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
        strokeWidth="2.2"
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
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}

function ProfileDropdown({
  user,
  theme,
  locale,
  onToggleTheme,
  onLocale,
}: {
  user: import('@/types').User | null;
  theme: 'light' | 'dark';
  locale: string;
  onToggleTheme: () => void;
  onLocale: (c: 'uz' | 'ru' | 'en') => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = (user?.username?.[0] ?? '?').toUpperCase();

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-1 group"
      >
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-primary-500 to-sky-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm ring-2 ring-transparent group-hover:ring-primary-400 transition-all">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <svg
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60 z-50 overflow-hidden animate-fade-in-up">
          {/* User info */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary-500 to-sky-500 flex items-center justify-center text-white font-extrabold flex-shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : initial}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{user?.username}</div>
                <div className="text-xs text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
          </div>

          {/* Profile link */}
          <div className="p-1.5">
            <button
              onClick={() => { setOpen(false); navigate('/profile'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t('nav.profile')}
            </button>
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-slate-100 dark:border-slate-700" />

          {/* Theme toggle */}
          <div className="p-1.5">
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-xp-500">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
                {theme === 'dark' ? t('settings.lightMode', 'Kunduzgi rejim') : t('settings.darkMode', 'Tungi rejim')}
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-500' : 'bg-slate-300'} relative`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Language */}
          <div className="px-3 pb-2">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 px-1">
              {t('settings.language', 'Til')}
            </div>
            <div className="flex gap-1">
              {langs.map((l) => (
                <button
                  key={l.code}
                  onClick={() => onLocale(l.code)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    locale === l.code
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-slate-100 dark:border-slate-700" />

          {/* Logout */}
          <div className="p-1.5">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-lives-600 dark:text-lives-400 hover:bg-lives-50 dark:hover:bg-lives-900/20 transition-colors text-left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t('nav.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
