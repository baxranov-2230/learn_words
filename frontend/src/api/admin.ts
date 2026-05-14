import { api } from './client';
import type { Deck, StoryListItem, User, UserRole } from '@/types';

export interface AdminStats {
  users_total: number;
  decks_total: number;
  public_decks: number;
  stories_total: number;
  game_sessions_total: number;
}

export const adminApi = {
  users: (page = 1, page_size = 50) =>
    api.get<User[]>('/admin/users', { params: { page, page_size } }).then((r) => r.data),
  patchUser: (id: number, data: { is_active?: boolean; role?: UserRole }) =>
    api.patch<User>(`/admin/users/${id}`, data).then((r) => r.data),
  decks: (params: { search?: string; page?: number; page_size?: number } = {}) =>
    api.get<Deck[]>('/admin/decks', { params }).then((r) => r.data),
  stories: (
    params: { course_id?: number; course_id_null?: boolean } = {},
  ) =>
    api.get<StoryListItem[]>('/admin/stories', { params }).then((r) => r.data),
  unpublishDeck: (deckId: number) =>
    api.patch(`/admin/decks/${deckId}/unpublish`).then((r) => r.data),
  stats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),
};
