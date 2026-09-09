import { create } from "zustand";

type PlayerState = "idle" | "loading" | "playing" | "paused" | "buffering" | "ended" | "error";

interface PlayerStore {
  state: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  setState: (state: PlayerState) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  state: "idle",
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  setState: (state) => set({ state }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
}));
