import { api } from './client';
import type { Language } from '@/types';

export interface LanguageCreatePayload {
  code: string;
  name: string;
  native_name?: string | null;
  flag?: string | null;
  color?: string | null;
  position?: number;
  is_active?: boolean;
}

export const languagesApi = {
  list: (params: { all?: boolean } = {}) =>
    api.get<Language[]>('/languages', { params }).then((r) => r.data),
  create: (data: LanguageCreatePayload) =>
    api.post<Language>('/languages', data).then((r) => r.data),
  update: (id: number, data: Partial<LanguageCreatePayload>) =>
    api.patch<Language>(`/languages/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/languages/${id}`).then((r) => r.data),
};
