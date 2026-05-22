import { api } from './client';
import type { DueCard, ProgressSummary, WeakCard } from '@/types';

export interface ReviewPayload {
  card_id: number;
  quality: number; // 0..5
  source?: 'flashcard' | 'test';
}

export const progressApi = {
  me: () => api.get<ProgressSummary>('/progress/me').then((r) => r.data),
  due: (params: { limit?: number; deck_id?: number } = {}) =>
    api.get<DueCard[]>('/progress/due', { params }).then((r) => r.data),
  review: (data: ReviewPayload) =>
    api.post('/progress/review', data).then((r) => r.data),
  weak: (source?: 'flashcard' | 'test', limit = 200) =>
    api.get<WeakCard[]>('/progress/weak', { params: { source, limit } }).then((r) => r.data),
};
