import { create } from "zustand";

export interface QueueItem {
  id: string;
  songId: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  addedBy: string;
  duration?: number;
  videoId?: string;
  channel?: string;
}

export type QueueStatus = "WAITING" | "PLAYING" | "COMPLETED" | "SKIPPED" | "REMOVED";

interface QueueState {
  nowPlaying: QueueItem | null;
  upcoming: QueueItem[];
  history: QueueItem[];
  addToQueue: (item: QueueItem) => void;
  removeFromQueue: (id: string) => void;
  moveToPosition: (id: string, toIndex: number) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  playNext: (id: string) => void;
  playSong: (item: QueueItem) => void;
  skipCurrent: () => void;
  clearQueue: () => void;
  completeCurrent: () => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  nowPlaying: null,
  upcoming: [],
  history: [],

  addToQueue: (item) =>
    set((s) => ({
      upcoming: [...s.upcoming, item],
    })),

  removeFromQueue: (id) =>
    set((s) => ({
      upcoming: s.upcoming.filter((i) => i.id !== id),
    })),

  moveToPosition: (id, toIndex) =>
    set((s) => {
      const fromIndex = s.upcoming.findIndex((i) => i.id === id);
      if (fromIndex < 0) return s;
      const clamped = Math.max(0, Math.min(toIndex, s.upcoming.length - 1));
      if (fromIndex === clamped) return s;
      const next = [...s.upcoming];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(clamped, 0, moved);
      return { upcoming: next };
    }),

  moveUp: (id) =>
    set((s) => {
      const idx = s.upcoming.findIndex((i) => i.id === id);
      if (idx <= 0) return s;
      const next = [...s.upcoming];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return { upcoming: next };
    }),

  moveDown: (id) =>
    set((s) => {
      const idx = s.upcoming.findIndex((i) => i.id === id);
      if (idx < 0 || idx >= s.upcoming.length - 1) return s;
      const next = [...s.upcoming];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return { upcoming: next };
    }),

  playNext: (id) =>
    set((s) => {
      const item = s.upcoming.find((i) => i.id === id);
      if (!item) return s;
      const rest = s.upcoming.filter((i) => i.id !== id);
      return {
        nowPlaying: item,
        upcoming: rest,
        history: s.nowPlaying ? [...s.history, s.nowPlaying] : s.history,
      };
    }),

  playSong: (item) =>
    set((s) => ({
      nowPlaying: item,
      history: s.nowPlaying ? [...s.history, s.nowPlaying] : s.history,
    })),

  skipCurrent: () =>
    set((s) => {
      if (!s.nowPlaying) return s;
      const next = s.upcoming[0] ?? null;
      return {
        nowPlaying: next,
        upcoming: s.upcoming.slice(1),
        history: [...s.history, s.nowPlaying],
      };
    }),

  completeCurrent: () =>
    set((s) => {
      if (!s.nowPlaying) return s;
      const next = s.upcoming[0] ?? null;
      return {
        nowPlaying: next,
        upcoming: s.upcoming.slice(1),
        history: [...s.history, s.nowPlaying],
      };
    }),

  clearQueue: () => set({ upcoming: [] }),
}));
