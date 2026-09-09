"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { mockArtwork } from "@/lib/artwork";

interface SongLike {
  artwork?: string;
  title?: string;
}

interface SongArtProps {
  song?: SongLike | null;
  artwork?: string;
  alt?: string;
  className?: string;
}

export function AlbumArt({ song, artwork, alt = "", className = "" }: SongArtProps) {
  const [failed, setFailed] = useState(false);
  const src = failed ? mockArtwork(song?.title ?? "Karaoke Song") : (artwork ?? song?.artwork);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || song?.title || "Album artwork"}
        loading="lazy"
        className={`shrink-0 object-cover ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center bg-surface-strong text-text-tertiary ${className}`}
    >
      <Music className="h-1/2 w-1/2" />
    </span>
  );
}