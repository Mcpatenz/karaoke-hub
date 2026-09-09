import { create } from "zustand";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  artwork?: string;
  duration?: number;
  plays?: number;
  videoId?: string;
  source?: "mock" | "youtube";
  channel?: string;
}

interface SearchState {
  query: string;
  results: Song[];
  isLoading: boolean;
  setQuery: (query: string) => void;
  setResults: (results: Song[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  results: [],
  isLoading: false,
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
