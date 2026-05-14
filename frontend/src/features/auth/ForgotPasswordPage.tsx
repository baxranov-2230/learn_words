import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { authApi } from '@/api/auth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await authApi.forgot(data.email);
    setDone(true);
  };

  return (
    <div className="max-w-md mx-auto pt-10">
      <Card>
        <h1 className="text-2xl font-bold mb-6">{t('auth.forgotTitle')}</h1>
        {done ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t('auth.forgotSent')}
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {t('auth.submit')}
            </Button>
          </form>
        )}
        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="text-primary-600 hover:underline">
            {t('common.back')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
