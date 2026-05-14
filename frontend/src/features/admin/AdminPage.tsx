import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { UsersAdmin } from './UsersAdmin';
import { StoriesAdmin } from './StoriesAdmin';
import { CoursesAdmin } from './CoursesAdmin';
import { LanguagesAdmin } from './LanguagesAdmin';
import { AdminStats } from './AdminStats';

type Tab = 'overview' | 'users' | 'languages' | 'courses' | 'stories';

function isTab(v: string | null): v is Tab {
  return v === 'overview' || v === 'users' || v === 'languages' || v === 'courses' || v === 'stories';
}

export function AdminPage() {
  const [params] = useSearchParams();
  const tab: Tab = isTab(params.get('tab')) ? (params.get('tab') as Tab) : 'overview';

  return (
    <div className="animate-fade-in-up">
      <div key={tab} className="animate-fade-in-up">
        {tab === 'overview' && <OverviewPanel />}
        {tab === 'users' && <UsersAdmin />}
        {tab === 'languages' && <LanguagesAdmin />}
        {tab === 'courses' && <CoursesAdmin />}
        {tab === 'stories' && <StoriesAdmin />}
      </div>
    </div>
  );
}

function OverviewPanel() {
  const { t } = useTranslation();
  const tips: { title: string; desc: string; icon: ReactNode; gradient: string; bg: string }[] = [
    {
      title: t('admin.overview.manageUsers'),
      desc: t('admin.overview.manageUsersDesc'),
      gradient: 'from-indigo-500 to-violet-600',
      bg: 'from-indigo-500/10 to-violet-600/5',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      title: t('admin.overview.publishStories'),
      desc: t('admin.overview.publishStoriesDesc'),
      gradient: 'from-amber-500 to-orange-600',
      bg: 'from-amber-500/10 to-orange-600/5',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      title: t('admin.overview.monitorActivity'),
      desc: t('admin.overview.monitorActivityDesc'),
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'from-emerald-500/10 to-teal-600/5',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminStats />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tips.map((tip, i) => (
        <div
          key={tip.title}
          className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/40 animate-fade-in-up stagger-${i + 1}`}
        >
          {/* Hover background gradient wash */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${tip.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          />
          {/* Decorative blob */}
          <div
            className={`pointer-events-none absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${tip.gradient} opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-20 group-hover:scale-110`}
          />
          <div className="relative">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${tip.gradient} text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
            >
              {tip.icon}
            </div>
            <h3 className="mt-4 font-semibold text-base">{tip.title}</h3>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {tip.desc}
            </p>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
