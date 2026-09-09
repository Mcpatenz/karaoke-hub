"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Plus } from "lucide-react";
import { useSearchStore } from "@/stores/searchStore";
import type { Song } from "@/stores/searchStore";
import { useToast } from "@/components/ui/Toast";
import { songProvider } from "@/lib/songProvider";

interface SongSearchProps {
  onAddSong?: (song: Song) => boolean | void;
  addedBy?: string;
  className?: string;
}

export default function SongSearch({ onAddSong, className = "" }: SongSearchProps) {
  const { query, setQuery, results, setResults, isLoading, setLoading } = useSearchStore();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = query.trim().toLowerCase();
      if (!q) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      songProvider
        .searchSongs(q)
        .then((s) => setResults(s))
        .finally(() => setLoading(false));
      setHasSearched(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, setResults, setLoading]);

  const handleAddSong = (song: Song) => {
    const accepted = onAddSong?.(song) ?? true;
    toast(accepted ? "Song added to queue" : "Song not added");
  };

  const hasResults = results.length > 0;
  const isEmptyState = hasSearched && !isLoading && !hasResults;

  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-text-tertiary" htmlFor="song-search">
        Search songs
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="song-search"
          type="search"
          autoComplete="off"
          placeholder="Search songs, artists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-autocomplete="list"
          aria-controls="song-search-results"
          className="h-11 w-full rounded-[var(--radius-xs)] border border-border-default bg-surface-raised pl-10 pr-10 text-sm text-text-primary placeholder:text-gray-500 transition-all duration-[var(--duration-instant)] hover:border-gray-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-surface-strong hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {isEmptyState && (
        <div className="mt-3 rounded-[var(--radius-sm)] border border-border-default bg-surface-muted p-5 text-center">
          <p className="text-sm font-medium text-text-primary">No songs found</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Try searching for:
            <br />a song title
            <br />an artist
            <br />a different spelling
          </p>
        </div>
      )}

      {hasResults && (
        <ul
          id="song-search-results"
          role="listbox"
          aria-label="Search results"
          className="mt-3 overflow-hidden rounded-[var(--radius-sm)] border border-border-default bg-surface-raised"
        >
          {results.map((song) => (
            <li
              key={song.id}
              role="option"
              aria-selected="false"
              className="flex items-center justify-between gap-3 border-b border-border-default px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{song.title}</p>
                <p className="truncate text-xs text-text-tertiary">{song.artist}</p>
              </div>
              <button
                onClick={() => handleAddSong(song)}
                aria-label={`Add ${song.title} to queue`}
                className="grid h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-[var(--radius-xs)] border border-border-default text-text-tertiary transition-all duration-[var(--duration-instant)] hover:border-accent hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}