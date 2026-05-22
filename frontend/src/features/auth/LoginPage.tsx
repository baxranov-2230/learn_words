import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const tokens = await authApi.login(data);
      setTokens(tokens);
      const me = await authApi.me();
      setUser(me);
      navigate('/dashboard');
    } catch {
      setServerError(t('auth.loginError'));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        {/* Hero mascot card */}
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-sky-500 text-white shadow-xl shadow-primary-500/30 mb-4 animate-bounce-soft">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {t('app.tagline')}
          </p>
        </div>

        <div className="card p-6 sm:p-8 animate-fade-in-up stagger-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label={t('auth.password')}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />
            {serverError && (
              <div className="px-4 py-3 rounded-2xl bg-lives-50 dark:bg-lives-500/10 border-2 border-lives-200 dark:border-lives-500/30">
                <p className="text-sm font-bold text-lives-600 dark:text-lives-400">
                  {serverError}
                </p>
              </div>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {t('auth.loginSubmit')}
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <Link
                to="/forgot"
                className="font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                {t('auth.forgot')}
              </Link>
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                {t('auth.noAccount')}{' '}
                <Link
                  to="/register"
                  className="font-extrabold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t('nav.register')}
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
