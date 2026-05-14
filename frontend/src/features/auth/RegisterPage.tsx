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
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
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
      await authApi.register(data);
      const tokens = await authApi.login({ email: data.email, password: data.password });
      setTokens(tokens);
      const me = await authApi.me();
      setUser(me);
      navigate('/dashboard');
    } catch (err: any) {
      setServerError(err?.response?.data?.detail || t('auth.registerError'));
    }
  };

  return (
    <div className="max-w-md mx-auto pt-10">
      <Card>
        <h1 className="text-2xl font-bold mb-6">{t('auth.registerTitle')}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('auth.username')}
            {...register('username')}
            error={errors.username?.message}
          />
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
            {t('auth.registerSubmit')}
          </Button>
          <div className="text-sm text-center">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              {t('nav.login')}
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
