import { api } from './client';
import type { TokenPair, User } from '@/types';

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  native_language?: string;
  learning_language?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (data: RegisterPayload) => api.post<User>('/auth/register', data).then((r) => r.data),
  login: (data: LoginPayload) => api.post<TokenPair>('/auth/login', data).then((r) => r.data),
  me: () => api.get<User>('/users/me').then((r) => r.data),
  forgot: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),
};
