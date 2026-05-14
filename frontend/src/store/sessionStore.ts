import { create } from 'zustand';

interface SessionState {
  isSessionActive: boolean;
  setSessionActive: (active: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isSessionActive: false,
  setSessionActive: (active) => set({ isSessionActive: active }),
}));
