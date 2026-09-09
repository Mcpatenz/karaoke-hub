"use client";

import { useEffect, useState } from "react";
import { Plus, Heart } from "lucide-react";
import type { Song } from "@/stores/searchStore";
import { useToast } from "@/components/ui/Toast";
import { songProvider } from "@/lib/songProvider";

interface SongListProps {
  title?: string;
  onAddToQueue?: (song: Song) => boolean | void;
  addedBy?: string;
  className?: string;
}

export default function SongList({
  title = "All Songs",
  onAddToQueue,
  className = "",
}: SongListProps) {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    let cancelled = false;
    songProvider
      .getTopPlayed(12)
      .then((s) => {
        if (!cancelled) setSongs(s);
      })
      .catch(() => {
        if (!cancelled) setSongs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFavorite = (id: string, name: string) => {
    const next = new Set(favorites);
    if (next.has(id)) {
      next.delete(id);
      toast(`${name} removed from favorites`);
    } else {
      next.add(id);
      toast("Added to favorites");
    }
    setFavorites(next);
  };

  return (
    <section aria-label={title} className={className}>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="overflow-hidden rounded-[var(--radius-sm)] border border-border-default">
        <div className="hidden bg-surface-raised text-xs font-semibold uppercase tracking-wider text-text-tertiary md:grid md:grid-cols-[48px_1fr_1fr_auto]">
          <span className="px-4 py-3">#</span>
          <span className="px-4 py-3">Song</span>
          <span className="px-4 py-3">Artist</span>
          <span className="sr-only">Actions</span>
        </div>
        <ul className="divide-y divide-border-default bg-surface-muted">
          {songs.map((song, i) => {
            const isFav = favorites.has(song.id);
            return (
              <li key={song.id}>
                {/* Desktop row */}
                <div className="hidden items-center border-b border-border-default px-0 py-0 last:border-b-0 hover:bg-surface-raised md:grid md:grid-cols-[48px_1fr_1fr_auto]">
                  <span className="px-4 text-xs font-mono text-text-tertiary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 px-4 py-3">
                    <p className="truncate text-sm font-medium text-text-primary">{song.title}</p>
                  </div>
                  <div className="min-w-0 px-4">
                    <p className="truncate text-sm text-text-tertiary">{song.artist}</p>
                  </div>
                  <div className="flex items-center gap-1 pr-3">
                    <button
                      onClick={() => toggleFavorite(song.id, song.title)}
                      aria-label={
                        isFav
                          ? `Remove ${song.title} from favorites`
                          : `Add ${song.title} to favorites`
                      }
                      aria-pressed={isFav}
                      className={`grid h-10 w-10 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                        isFav
                          ? "text-accent"
                          : "text-text-tertiary hover:bg-surface-strong hover:text-text-primary"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => {
                        const accepted = onAddToQueue?.(song) ?? true;
                        if (accepted) toast("Song added to queue");
                      }}
                      aria-label={`Add ${song.title} to queue`}
                      className="grid h-10 w-10 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="flex items-center justify-between gap-2 border-b border-border-default px-3 py-3 last:border-b-0 hover:bg-surface-raised md:hidden">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{song.title}</p>
                    <p className="truncate text-xs text-text-tertiary">{song.artist}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => toggleFavorite(song.id, song.title)}
                      aria-label={
                        isFav
                          ? `Remove ${song.title} from favorites`
                          : `Add ${song.title} to favorites`
                      }
                      aria-pressed={isFav}
                      className={`grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                        isFav
                          ? "text-accent"
                          : "text-text-tertiary hover:bg-surface-strong hover:text-text-primary"
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isFav ? "fill-current" : ""}`} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => {
                        const accepted = onAddToQueue?.(song) ?? true;
                        if (accepted) toast("Song added to queue");
                      }}
                      aria-label={`Add ${song.title} to queue`}
                      className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <Plus className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}