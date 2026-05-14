import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { Card } from '@/components/ui/Card';
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
    <div className="max-w-md mx-auto pt-10">
      <Card>
        <h1 className="text-2xl font-bold mb-1">{t('auth.loginTitle')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('app.tagline')}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label={t('auth.password')}
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {t('auth.loginSubmit')}
          </Button>
          <div className="flex justify-between text-sm">
            <Link to="/forgot" className="text-primary-600 hover:underline">
              {t('auth.forgot')}
            </Link>
            <span>
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary-600 hover:underline">
                {t('nav.register')}
              </Link>
            </span>
          </div>
        </form>
      </Card>
    </div>
  );
}
