import { api } from './client';
import type { Course, CourseDetail } from '@/types';

export interface CourseCreatePayload {
  title: string;
  description?: string | null;
  level?: string | null;
  topic?: string | null;
  source_lang?: string;
  target_lang?: string;
  cover_color?: string | null;
  is_published?: boolean;
  position?: number;
  language_id?: number | null;
}

export const coursesApi = {
  list: (params: { level?: string; topic?: string; language_id?: number } = {}) =>
    api.get<Course[]>('/courses', { params }).then((r) => r.data),
  get: (id: number) => api.get<CourseDetail>(`/courses/${id}`).then((r) => r.data),
  manage: (id: number) =>
    api.get<CourseDetail>(`/courses/${id}/manage`).then((r) => r.data),
  create: (data: CourseCreatePayload) =>
    api.post<Course>('/courses', data).then((r) => r.data),
  update: (id: number, data: Partial<CourseCreatePayload>) =>
    api.patch<Course>(`/courses/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/courses/${id}`).then((r) => r.data),
};
