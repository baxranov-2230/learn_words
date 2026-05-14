import { api } from './client';
import type { Deck, Story, StoryListItem, StoryQuiz } from '@/types';

export interface StoryListParams {
  level?: string;
  topic?: string;
  deck_id?: number;
  standalone?: boolean;
}

export const storiesApi = {
  list: (params: StoryListParams = {}) =>
    api.get<StoryListItem[]>('/stories', { params }).then((r) => r.data),
  get: (id: number) => api.get<Story>(`/stories/${id}`).then((r) => r.data),
  quiz: (id: number) => api.get<StoryQuiz>(`/stories/${id}/quiz`).then((r) => r.data),
  cloneAsDeck: (id: number) =>
    api.post<Deck>(`/stories/${id}/clone-as-deck`).then((r) => r.data),
  createAdmin: (data: any) => api.post<Story>('/stories', data).then((r) => r.data),
  updateAdmin: (id: number, data: any) =>
    api.patch<Story>(`/stories/${id}`, data).then((r) => r.data),
  removeAdmin: (id: number) => api.delete(`/stories/${id}`).then((r) => r.data),
};
