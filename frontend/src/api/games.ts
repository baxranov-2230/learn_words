import { api } from './client';
import type { GameStartResponse, GameType, LeaderboardEntry } from '@/types';

export interface GameSessionPayload {
  deck_id?: number | null;
  game_type: GameType;
  score?: number;
  duration_seconds?: number;
  correct?: number;
  incorrect?: number;
}

export const gamesApi = {
  start: (mode: GameType, deckId: number, limit = 200) =>
    api
      .post<GameStartResponse>(`/games/${mode}/start`, { deck_id: deckId, limit })
      .then((r) => r.data),
  saveSession: (data: GameSessionPayload) =>
    api.post('/games/sessions', data).then((r) => r.data),
  leaderboard: (gameType: GameType, deckId?: number, limit = 10) =>
    api
      .get<LeaderboardEntry[]>('/games/leaderboard', {
        params: { game_type: gameType, deck_id: deckId, limit },
      })
      .then((r) => r.data),
};
