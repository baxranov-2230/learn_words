import { api } from './client';
import type {
  CourseProgress,
  Lesson,
  LessonAttemptResult,
  LessonStatus,
} from '@/types';

export interface LessonCreatePayload {
  title: string;
  passing_score?: number;
  position?: number;
  deck_id?: number | null;
  story_id?: number | null;
}

export const lessonsApi = {
  list: (courseId: number) =>
    api
      .get<LessonStatus[]>(`/courses/${courseId}/lessons`)
      .then((r) => r.data),
  progress: (courseId: number) =>
    api
      .get<CourseProgress>(`/courses/${courseId}/progress`)
      .then((r) => r.data),
  create: (courseId: number, data: LessonCreatePayload) =>
    api
      .post<Lesson>(`/courses/${courseId}/lessons`, data)
      .then((r) => r.data),
  update: (id: number, data: Partial<LessonCreatePayload>) =>
    api.patch<Lesson>(`/lessons/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/lessons/${id}`).then((r) => r.data),
  attempt: (id: number, score: number) =>
    api
      .post<LessonAttemptResult>(`/lessons/${id}/attempt`, { score })
      .then((r) => r.data),
};
