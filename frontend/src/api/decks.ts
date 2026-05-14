import { api } from './client';
import type { Card, CardCreate, Deck, DeckList } from '@/types';

export interface DeckCreatePayload {
  title: string;
  description?: string;
  source_lang: string;
  target_lang: string;
  level?: string;
  topic?: string;
  is_public?: boolean;
  course_id?: number | null;
}

export interface DeckListParams {
  scope?: 'mine' | 'public';
  search?: string;
  source_lang?: string;
  target_lang?: string;
  level?: string;
  topic?: string;
  page?: number;
  page_size?: number;
}

export const decksApi = {
  list: (params: DeckListParams = {}) =>
    api.get<DeckList>('/decks', { params }).then((r) => r.data),
  get: (id: number) => api.get<Deck>(`/decks/${id}`).then((r) => r.data),
  create: (data: DeckCreatePayload) => api.post<Deck>('/decks', data).then((r) => r.data),
  update: (id: number, data: Partial<DeckCreatePayload>) =>
    api.patch<Deck>(`/decks/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/decks/${id}`).then((r) => r.data),
  clone: (id: number) => api.post<Deck>(`/decks/${id}/clone`).then((r) => r.data),
};

export const cardsApi = {
  list: (deckId: number) => api.get<Card[]>(`/decks/${deckId}/cards`).then((r) => r.data),
  bulkCreate: (deckId: number, cards: CardCreate[]) =>
    api
      .post<Card[]>(`/decks/${deckId}/cards/bulk`, { cards })
      .then((r) => r.data),
  create: (deckId: number, card: CardCreate) =>
    api.post<Card>(`/decks/${deckId}/cards`, card).then((r) => r.data),
  update: (id: number, card: Partial<CardCreate>) =>
    api.patch<Card>(`/cards/${id}`, card).then((r) => r.data),
  remove: (id: number) => api.delete(`/cards/${id}`).then((r) => r.data),
};
