import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/auth';

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const location = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: !!accessToken && !user,
    retry: false,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!user && isLoading) {
    return <div className="text-center text-slate-500 py-10">Yuklanmoqda...</div>;
  }
  return <Outlet />;
}

export function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
