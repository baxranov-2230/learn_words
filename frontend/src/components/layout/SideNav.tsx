import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useSessionStore } from '@/store/sessionStore';

type ColorKey = 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'fuchsia';

interface NavChild {
  key: string;
  labelKey: string;
  to: string;
}

interface NavItem {
  key: string;
  labelKey: string;
  icon: ReactNode;
  color: ColorKey;
  to?: string;
  children?: NavChild[];
  adminOnly?: boolean;
}

interface NavSection {
  labelKey: string;
  items: NavItem[];
}

const COLOR_STYLES: Record<
  ColorKey,
  { iconBg: string; iconText: string; gradient: string; shadow: string; ring: string; dot: string }
> = {
  indigo: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-500 to-violet-600',
    shadow: 'shadow-indigo-500/30',
    ring: 'ring-indigo-500',
    dot: 'bg-indigo-500',
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/30',
    ring: 'ring-emerald-500',
    dot: 'bg-emerald-500',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconText: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/30',
    ring: 'ring-amber-500',
    dot: 'bg-amber-500',
  },
  sky: {
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
    iconText: 'text-sky-600 dark:text-sky-400',
    gradient: 'from-sky-500 to-blue-600',
    shadow: 'shadow-sky-500/30',
    ring: 'ring-sky-500',
    dot: 'bg-sky-500',
  },
  rose: {
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
    iconText: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-500/30',
    ring: 'ring-rose-500',
    dot: 'bg-rose-500',
  },
  fuchsia: {
    iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10',
    iconText: 'text-fuchsia-600 dark:text-fuchsia-400',
    gradient: 'from-fuchsia-500 to-purple-600',
    shadow: 'shadow-fuchsia-500/30',
    ring: 'ring-fuchsia-500',
    dot: 'bg-fuchsia-500',
  },
};

const SECTIONS: NavSection[] = [
  {
    labelKey: 'nav.section.main',
    items: [
      {
        key: 'dashboard',
        labelKey: 'nav.dashboard',
        to: '/dashboard',
        color: 'indigo',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        key: 'courses',
        labelKey: 'nav.courses',
        to: '/courses',
        color: 'fuchsia',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        ),
      },
      {
        key: 'stats',
        labelKey: 'nav.stats',
        to: '/stats',
        color: 'sky',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
    ],
  },
  {
    labelKey: 'nav.section.admin',
    items: [
      {
        key: 'admin',
        labelKey: 'nav.admin',
        color: 'rose',
        adminOnly: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
        children: [
          { key: 'overview', labelKey: 'admin.tab.overview', to: '/admin?tab=overview' },
          { key: 'users', labelKey: 'admin.tab.users', to: '/admin?tab=users' },
          { key: 'languages', labelKey: 'admin.tab.languages', to: '/admin?tab=languages' },
          { key: 'courses', labelKey: 'admin.tab.courses', to: '/admin?tab=courses' },
          { key: 'stories', labelKey: 'admin.tab.stories', to: '/admin?tab=stories' },
        ],
      },
    ],
  },
];

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export function SideNav({ mobileOpen, onClose }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleCollapse = useUIStore((s) => s.toggleSidebar);
  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const setSessionActive = useSessionStore((s) => s.setSessionActive);

  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const handleNav = (to: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isSessionActive) {
      setPendingPath(to);
      setShowExitModal(true);
    } else {
      navigate(to);
    }
  };

  const confirmExit = () => {
    if (pendingPath) {
      setSessionActive(false);
      navigate(pendingPath);
    }
    setShowExitModal(false);
    setPendingPath(null);
  };

  const visibleSections = useMemo(
    () =>
      SECTIONS.map((sec) => ({
        ...sec,
        items: sec.items.filter((it) => !it.adminOnly || user?.role === 'admin'),
      })).filter((sec) => sec.items.length > 0),
    [user],
  );

  const matches = (path: string) => {
    if (location.pathname === path) return true;
    if (path !== '/' && location.pathname.startsWith(path + '/')) return true;
    return false;
  };

  const isItemActive = (item: NavItem) => {
    if (item.to && matches(item.to)) return true;
    if (item.children) return item.children.some((c) => matches(c.to.split('?')[0]));
    return false;
  };

  const initialOpen = useMemo(() => {
    const map: Record<string, boolean> = {};
    visibleSections.forEach((sec) =>
      sec.items.forEach((it) => {
        if (it.children) map[it.key] = isItemActive(it);
      }),
    );
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSections]);

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(initialOpen);

  // Auto-open submenu when navigating into it
  useEffect(() => {
    setOpenSubmenus((prev) => {
      const next = { ...prev };
      visibleSections.forEach((sec) =>
        sec.items.forEach((it) => {
          if (it.children && isItemActive(it)) next[it.key] = true;
        }),
      );
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const widthClass = collapsed ? 'lg:w-[78px]' : 'lg:w-[260px]';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${
            collapsed ? 'lg:pl-[78px]' : 'lg:pl-[280px]'
          }`}
          onClick={() => setShowExitModal(false)}
        >
          <div
            className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 text-center mb-2">
              {t('games.exitTitle', "O'yinni tark etasizmi?")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              {t('games.exitDesc', "O'yin tugamadi. Chiqsangiz, natija saqlanmaydi.")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {t('games.continueGame', "Davom etish")}
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-3 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/30"
              >
                {t('games.exitGame', "Chiqish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[280px] ${widthClass} flex-shrink-0 transition-[width,transform] duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="relative h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          {/* Subtle dot pattern on top */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-32 bg-dot-pattern opacity-50" />

          {/* Header / logo */}
          <div className="relative flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={(e) => handleNav('/', e as any)}
              className="flex items-center gap-2.5 min-w-0 flex-1 group text-left"
            >
              <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                {/* subtle pulse ring */}
                <span className="absolute inset-0 rounded-xl ring-2 ring-indigo-500/30 animate-pulse-ring" />
              </span>
              <span
                className={`flex flex-col min-w-0 transition-all duration-300 overflow-hidden ${
                  collapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'
                }`}
              >
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white truncate">
                  {t('app.name')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold truncate">
                  {t('app.tagline')}
                </span>
              </span>
            </button>
            {/* Mobile close */}
            <button
              onClick={onClose}
              className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Nav scroll area */}
          <nav className="relative flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-5">
            {visibleSections.map((section) => (
              <div key={section.labelKey}>
                <div
                  className={`flex items-center gap-2 mb-2 px-3 transition-all duration-300 ${
                    collapsed ? 'lg:opacity-0 lg:h-0 lg:mb-0 lg:overflow-hidden' : ''
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                    {t(section.labelKey)}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700" />
                </div>
                <div className="space-y-1">
                  {section.items.map((item, i) => (
                    <SideNavItem
                      key={item.key}
                      item={item}
                      index={i}
                      collapsed={collapsed}
                      isOpen={!!openSubmenus[item.key]}
                      onToggle={() =>
                        setOpenSubmenus((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key],
                        }))
                      }
                      isActive={isItemActive(item)}
                      onNav={handleNav}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="relative border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
            {user && (
              <>
                {/* Expanded user pill */}
                <div
                  className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 transition-all duration-300 ${
                    collapsed ? 'lg:hidden' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user.username}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold truncate">
                      {user.role}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title={t('nav.logout')}
                    className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-400 transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label="logout"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </div>

                {/* Collapsed avatar + logout (desktop only) */}
                <div className={`hidden ${collapsed ? 'lg:flex' : ''} flex-col items-center gap-2`}>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </div>
                  <button
                    onClick={handleLogout}
                    title={t('nav.logout')}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-400 transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label="logout"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </div>
              </>
            )}

            <button
              onClick={toggleCollapse}
              className={`hidden lg:flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              }`}
              aria-label="collapse"
            >
              <svg
                className={`transition-transform duration-300 ${
                  collapsed ? 'rotate-180' : ''
                }`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
              <span
                className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  collapsed ? 'w-0 opacity-0' : ''
                }`}
              >
                {t('nav.collapse')}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

interface SideNavItemProps {
  item: NavItem;
  index: number;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  isActive: boolean;
  onNav: (to: string, e?: React.MouseEvent) => void;
}

function SideNavItem({ item, index, collapsed, isOpen, onToggle, isActive, onNav }: SideNavItemProps) {
  const { t } = useTranslation();
  const hasChildren = !!item.children?.length;
  const showText = !collapsed;
  const showSubmenu = isOpen && !collapsed;
  const styles = COLOR_STYLES[item.color];

  const baseRow = `group relative w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 animate-fade-in-up stagger-${(index % 6) + 1} ${
    collapsed ? 'lg:px-0 lg:py-2 lg:justify-center px-3 py-2.5' : 'px-3 py-2.5'
  }`;

  const renderIcon = () => (
    <span
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-all duration-300 ${
        isActive
          ? 'bg-white/25 text-white'
          : `${styles.iconBg} ${styles.iconText} group-hover:scale-110 group-hover:-rotate-3`
      } ${collapsed && isActive ? `lg:ring-2 ${styles.ring}` : ''}`}
    >
      {item.icon}
    </span>
  );

  const labelClasses = `flex-1 truncate text-left transition-all duration-300 overflow-hidden ${
    showText ? 'opacity-100' : 'lg:opacity-0 lg:w-0'
  }`;

  const activeRowClass = `bg-gradient-to-r ${styles.gradient} text-white shadow-lg ${styles.shadow}`;
  const inactiveRowClass = `text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white`;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          title={collapsed ? t(item.labelKey) : undefined}
          className={`${baseRow} ${isActive ? activeRowClass : inactiveRowClass}`}
        >
          {renderIcon()}
          <span className={labelClasses}>{t(item.labelKey)}</span>
          {showText && (
            <svg
              className={`flex-shrink-0 transition-transform duration-300 ${
                isOpen ? 'rotate-90' : ''
              } ${isActive ? 'text-white/85' : 'text-slate-400'}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>

        {/* Submenu */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            showSubmenu ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <ul className="ml-5 mt-1.5 mb-1 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-0.5">
              {item.children!.map((child) => (
                <SideNavChild key={child.key} child={child} color={item.color} onNav={onNav} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => onNav(item.to!, e)}
      title={collapsed ? t(item.labelKey) : undefined}
      className={`${baseRow} ${isActive ? activeRowClass : inactiveRowClass}`}
    >
      {renderIcon()}
      <span className={labelClasses}>{t(item.labelKey)}</span>
    </button>
  );
}

function SideNavChild({ child, color, onNav }: { child: NavChild; color: ColorKey; onNav: (to: string, e?: React.MouseEvent) => void }) {
  const { t } = useTranslation();
  const location = useLocation();
  const styles = COLOR_STYLES[color];
  const [path, query = ''] = child.to.split('?');
  const childTab = new URLSearchParams(query).get('tab');
  const currentTab = new URLSearchParams(location.search).get('tab') ?? '';
  const isActive =
    location.pathname === path && (childTab ? childTab === currentTab : true);

  return (
    <li>
      <button
        onClick={(e) => onNav(child.to, e)}
        className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
          isActive
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
        }`}
      >
        {isActive && (
          <span
            className={`absolute left-[-17px] top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-full ${styles.dot}`}
          />
        )}
        <span
          className={`w-1.5 h-1.5 rounded-full transition-all ${
            isActive ? styles.dot : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400'
          }`}
        />
        {t(child.labelKey)}
      </button>
    </li>
  );
}
