"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Play, Pause, Plus, Search, X, Check, TrendingUp } from "lucide-react";
import type { Song } from "@/stores/searchStore";
import { songProvider } from "@/lib/songProvider";
import { AlbumArt } from "./SongArt";

interface AddSongPanelProps {
  queueCount: number;
  onBack: () => void;
  onAddSong: (song: Song) => boolean;
}

export default function AddSongPanel({ queueCount, onBack, onAddSong }: AddSongPanelProps) {
  return (
    <div className="relative flex h-full flex-col">
      <AddSongHeader queueCount={queueCount} onBack={onBack} />
      <AddSongBody onAddSong={onAddSong} />
    </div>
  );
}

function AddSongHeader({ queueCount, onBack }: { queueCount: number; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1 pb-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-9 min-h-[44px] items-center gap-1.5 rounded-[var(--radius-xs)] px-1 text-sm text-text-tertiary transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </button>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-white">Add Song</h2>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
          Queue ({queueCount})
        </span>
      </div>
    </div>
  );
}

function AddSongBody({ onAddSong }: { onAddSong: (song: Song) => boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [preview, setPreview] = useState<Song | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [topPlayed, setTopPlayed] = useState<Song[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingTop(true);
    songProvider.getTopPlayed(10).then((songs) => {
      if (!cancelled) setTopPlayed(songs);
    }).finally(() => {
      if (!cancelled) setLoadingTop(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      songProvider.searchSongs(q).then((res) => setResults(res)).finally(() => setIsLoading(false));
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleAdd = (song: Song) => {
    if (addedIds.has(song.id)) return;
    const ok = onAddSong(song);
    if (!ok) return;
    setAddedIds((s) => {
      const next = new Set(s);
      next.add(song.id);
      return next;
    });
    setTimeout(() => {
      setAddedIds((s) => {
        const next = new Set(s);
        next.delete(song.id);
        return next;
      });
    }, 1500);
  };

  return (
    <div className="relative flex-1 overflow-y-auto pr-1">
      <div className="sticky top-0 z-10 bg-[#141414] pb-2">
        <SearchBar
          value={query}
          onChange={setQuery}
          inputRef={inputRef}
          onClear={() => setQuery("")}
          isLoading={isLoading}
        />
      </div>

      <div className="py-2">
        {!hasSearched && !isLoading && (
          <TopPlayedList
            songs={topPlayed}
            loading={loadingTop}
            addedIds={addedIds}
            onAdd={(song) => handleAdd(song)}
            onOpen={(song) => setPreview(song)}
          />
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-text-tertiary" role="status">
            <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden="true" />
            <span className="text-sm">Searching...</span>
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-text-primary">No songs found</p>
            <p className="mt-1 text-xs text-text-tertiary">Try a different title, artist, or album.</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <motion.ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {results.map((song, i) => (
                <SongCard
                  key={song.id}
                  song={song}
                  index={i}
                  added={addedIds.has(song.id)}
                  onAdd={() => handleAdd(song)}
                  onOpen={() => setPreview(song)}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      <PreviewDrawer song={preview} onClose={() => setPreview(null)} onAdd={() => handleAdd(preview!)} />
    </div>
  );
}

function SearchBar({
  value,
  onChange,
  inputRef,
  onClear,
  isLoading,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClear: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        autoComplete="off"
        placeholder="Search songs, artists, or albums..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-autocomplete="list"
        aria-label="Search songs"
        className="h-11 w-full rounded-[var(--radius-xs)] border border-border-default bg-[#1a1a1a] pl-10 pr-16 text-sm text-white placeholder:text-text-tertiary/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
        )}
        {value && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-surface-strong hover:text-text-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <span className="hidden rounded border border-border-default bg-[#141414] px-1.5 py-0.5 text-[10px] text-text-tertiary sm:inline">
          Ctrl K
        </span>
      </div>
    </div>
  );
}

function TopPlayedList({
  songs,
  loading,
  addedIds,
  onAdd,
  onOpen,
}: {
  songs: Song[];
  loading: boolean;
  addedIds: Set<string>;
  onAdd: (song: Song) => void;
  onOpen: (song: Song) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/10 text-accent">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Top 10 Played</p>
          <p className="text-[11px] text-text-tertiary">Highest play counts first</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-text-tertiary" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden="true" />
          <span className="text-sm">Loading top songs...</span>
        </div>
      ) : (
        <motion.ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {songs.map((song, i) => (
              <TopSongRow
                key={song.id}
                song={song}
                rank={i + 1}
                added={addedIds.has(song.id)}
                onAdd={() => onAdd(song)}
                onOpen={() => onOpen(song)}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

function TopSongRow({
  song,
  rank,
  added,
  onAdd,
  onOpen,
}: {
  song: Song;
  rank: number;
  added: boolean;
  onAdd: () => void;
  onOpen: () => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: rank * 0.03 }}
      className="group flex items-center gap-2 rounded-[var(--radius-xs)] border border-border-default bg-[#1a1a1a] p-2 transition-colors hover:border-accent/40"
    >
      <span
        className={`w-6 shrink-0 text-center font-mono text-sm font-bold ${
          rank <= 3 ? "text-accent" : "text-text-tertiary"
        }`}
      >
        {rank}
      </span>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${song.title} by ${song.artist}`}
        className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-accent"
      >
        <AlbumArt song={song} className="h-10 w-10 rounded-[var(--radius-xs)]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{song.title}</p>
          <p className="truncate text-xs text-text-tertiary">{song.artist}</p>
          <p className="truncate text-[11px] text-text-tertiary/70">
            {formatPlays(song.plays)} plays
          </p>
        </div>
      </button>
      <button
        type="button"
        disabled={added}
        onClick={onAdd}
        aria-label={`Add ${song.title} to queue`}
        className={`inline-flex h-9 min-h-[44px] shrink-0 items-center gap-1.5 rounded-[var(--radius-xs)] border px-2.5 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-accent ${
          added
            ? "border-status-success bg-status-success/10 text-status-success"
            : "border-accent/40 text-accent hover:bg-accent hover:text-white"
        }`}
      >
        {added ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Plus className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </motion.li>
  );
}

function formatPlays(plays?: number): string {
  if (!plays) return "0";
  if (plays >= 1_000_000) return `${(plays / 1_000_000).toFixed(1)}M`;
  if (plays >= 1_000) return `${Math.round(plays / 1_000)}K`;
  return String(plays);
}

function SongCard({
  song,
  index,
  added,
  onAdd,
  onOpen,
}: {
  song: Song;
  index: number;
  added: boolean;
  onAdd: () => void;
  onOpen: () => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="group flex items-center gap-3 rounded-[var(--radius-xs)] border border-border-default bg-[#1a1a1a] p-2 transition-colors hover:border-accent/40"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${song.title} by ${song.artist}`}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-accent"
      >
        <AlbumArt song={song} className="h-11 w-11 rounded-[var(--radius-xs)]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{song.title}</p>
          <p className="truncate text-xs text-text-tertiary">{song.artist}</p>
          <p className="truncate text-[11px] text-text-tertiary/70">
            {song.source === "youtube"
              ? `Karaoke video • ${song.channel ?? "YouTube"}`
              : [song.album, song.year].filter(Boolean).join(" • ")}
          </p>
        </div>
      </button>

      <button
        type="button"
        disabled={added}
        onClick={onAdd}
        aria-label={`Add ${song.title} to queue`}
        className={`inline-flex h-9 min-h-[44px] shrink-0 items-center gap-1.5 rounded-[var(--radius-xs)] border px-3 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-accent ${
          added
            ? "border-status-success bg-status-success/10 text-status-success"
            : "border-accent/40 text-accent hover:bg-accent hover:text-white"
        }`}
      >
        {added ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Added
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </>
        )}
      </button>
    </motion.li>
  );
}

function PreviewDrawer({
  song,
  onClose,
  onAdd,
}: {
  song: Song | null;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [song?.videoId]);

  return (
    <AnimatePresence>
      {song && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label={`${song.title} preview`}
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-sm flex-col gap-4 overflow-y-auto border-l border-border-default bg-[#111111] p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
                Song Preview
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="grid h-9 w-9 place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-surface-strong hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="rounded-[var(--radius-sm)] border border-border-default bg-[#181818] p-2">
              {song.videoId ? (
                <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-xs)] bg-black">
                  <iframe
                    key={song.videoId}
                    src={`https://www.youtube-nocookie.com/embed/${song.videoId}?rel=0${playing ? "&autoplay=1" : ""}`}
                    title={`${song.title} karaoke video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <AlbumArt song={song} className="aspect-square w-full rounded-[var(--radius-xs)]" />
              )}
              <div className="p-3">
                <p className="truncate text-lg font-bold text-white">{song.title}</p>
                <p className="mt-0.5 truncate text-sm text-text-tertiary">{song.artist}</p>
                <p className="mt-0.5 truncate text-xs text-text-tertiary/70">
                  {song.source === "youtube"
                    ? `Karaoke video • ${song.channel ?? "YouTube"}`
                    : [song.album, song.year].filter(Boolean).join(" • ")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {song.videoId && (
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="inline-flex h-12 min-h-[48px] items-center justify-center gap-2 rounded-[var(--radius-xs)] border border-border-default bg-[#1a1a1a] text-sm font-semibold text-white transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {playing ? (
                    <Pause className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden="true" />
                  )}
                  {playing ? "Pause Preview" : "Preview"}
                </button>
              )}
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex h-12 min-h-[48px] items-center justify-center gap-2 rounded-[var(--radius-xs)] bg-accent text-sm font-semibold text-text-inverse transition-colors hover:bg-accent-hover"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add to Queue
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
