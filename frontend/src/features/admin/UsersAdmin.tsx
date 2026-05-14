import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import type { User, UserRole } from '@/types';

type RoleFilter = 'all' | UserRole;
type StatusFilter = 'all' | 'active' | 'inactive';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? '';
  const b = parts[1]?.[0] ?? '';
  return (a + b || a).toUpperCase();
}

function avatarGradient(seed: string) {
  const palette = [
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-sky-500 to-blue-600',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-600',
    'from-fuchsia-500 to-violet-600',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function RoleBadge({ role, onChange }: { role: UserRole; onChange: (r: UserRole) => void }) {
  const { t } = useTranslation();
  const isAdmin = role === 'admin';
  return (
    <div className="relative group/role inline-flex">
      <select
        value={role}
        onChange={(e) => onChange(e.target.value as UserRole)}
        title={t('admin.users.col.role')}
        className={`appearance-none cursor-pointer text-xs font-semibold rounded-lg px-3 py-1.5 pr-7 border transition-all duration-200 focus:outline-none focus:ring-2 ${
          isAdmin
            ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 focus:ring-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/40'
            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 focus:ring-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
        }`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '0.6rem',
        }}
      >
        <option value="user">{t('admin.users.role.user')}</option>
        <option value="admin">{t('admin.users.role.admin')}</option>
      </select>
    </div>
  );
}

function StatusToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onToggle}
      title={active ? t('admin.users.inactive') : t('admin.users.active')}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 border transition-all duration-200 hover:scale-105 active:scale-95 ${
        active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          active ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />
      {active ? t('admin.users.active') : t('admin.users.inactive')}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function UsersAdmin() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users(1, 100),
  });

  const patchMut = useMutation({
    mutationFn: (args: { id: number; data: { is_active?: boolean; role?: UserRole } }) =>
      adminApi.patchUser(args.id, args.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    if (!data) return [] as User[];
    const q = search.trim().toLowerCase();
    return data.filter((u) => {
      if (q && !u.email.toLowerCase().includes(q) && !u.username.toLowerCase().includes(q)) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'inactive' && u.is_active) return false;
      return true;
    });
  }, [data, search, roleFilter, statusFilter]);

  const counts = useMemo(() => {
    const total = data?.length ?? 0;
    const admins = data?.filter((u) => u.role === 'admin').length ?? 0;
    const active = data?.filter((u) => u.is_active).length ?? 0;
    return { total, admins, active };
  }, [data]);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Jami foydalanuvchi", value: counts.total, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "Faol", value: counts.active, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Adminlar", value: counts.admins, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl ${s.bg} border border-slate-200 dark:border-slate-700 px-4 py-3`}>
            <div className={`text-2xl font-extrabold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.users.search')}
            className="input pl-9 w-full"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <label className="absolute -top-2 left-2.5 text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-800 px-1 z-10">Rol</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="input py-2 pr-8 cursor-pointer w-full"
            >
              <option value="all">{t('admin.users.allRoles')}</option>
              <option value="admin">{t('admin.users.role.admin')}</option>
              <option value="user">{t('admin.users.role.user')}</option>
            </select>
          </div>
          <div className="relative flex-1 sm:flex-none">
            <label className="absolute -top-2 left-2.5 text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-800 px-1 z-10">Holat</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="input py-2 pr-8 cursor-pointer w-full"
            >
              <option value="all">{t('admin.users.allStatuses')}</option>
              <option value="active">{t('admin.users.active')}</option>
              <option value="inactive">{t('admin.users.inactive')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

        {/* Loading */}
        {isLoading && (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full skeleton-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded skeleton-shimmer" />
                  <div className="h-3 w-44 rounded skeleton-shimmer" />
                </div>
                <div className="h-7 w-24 rounded-lg skeleton-shimmer hidden sm:block" />
                <div className="h-7 w-20 rounded-lg skeleton-shimmer hidden sm:block" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 mb-3">
              <SearchIcon />
            </div>
            <p className="text-sm text-slate-500">{t('admin.users.empty')}</p>
          </div>
        )}

        {/* Mobile list */}
        {!isLoading && filtered.length > 0 && (
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map((u, i) => (
              <div
                key={u.id}
                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors animate-fade-in-up stagger-${(i % 6) + 1}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(u.username || u.email)} text-white text-sm font-bold flex items-center justify-center`}>
                    {initials(u.username || u.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{u.username}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">#{u.id}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <RoleBadge role={u.role} onChange={(r) => patchMut.mutate({ id: u.id, data: { role: r } })} />
                  <StatusToggle active={u.is_active} onToggle={() => patchMut.mutate({ id: u.id, data: { is_active: !u.is_active } })} />
                  <span className="text-xs text-slate-400 ml-auto">{formatDate(u.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        {!isLoading && filtered.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Foydalanuvchi
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Holat
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Qo'shilgan sana
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group animate-fade-in-up stagger-${(i % 6) + 1}`}
                  >
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(u.username || u.email)} text-white text-xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-800`}>
                          {initials(u.username || u.email)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                            {u.username}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <RoleBadge
                        role={u.role}
                        onChange={(r) => patchMut.mutate({ id: u.id, data: { role: r } })}
                      />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusToggle
                        active={u.is_active}
                        onToggle={() => patchMut.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                      />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{formatDate(u.created_at)}</span>
                    </td>

                    {/* ID */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        #{u.id}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {filtered.length} ta foydalanuvchi ko'rsatilmoqda
              </span>
              <span className="text-xs text-slate-400">
                Rolni o'zgartirish yoki holatni bosish uchun tegishli ustunlardan foydalaning
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
