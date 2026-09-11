"use client";

import { useEffect, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import type { QueueItem } from "@/stores/queueStore";
import { AlbumArt } from "./SongArt";
import { ModernVideoPlayer, type VideoPlayerHandle } from "./ModernVideoPlayer";

interface NowPlayingStageProps {
  song: QueueItem;
  onEnded?: () => void;
  playerRef?: RefObject<VideoPlayerHandle | null>;
}

export function NowPlayingStage({ song, onEnded, playerRef }: NowPlayingStageProps) {
  if (song.videoId) {
    return (
      <motion.div
        key={song.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative h-full w-full"
      >
        <ModernVideoPlayer ref={playerRef} song={song} onEnded={onEnded} />
      </motion.div>
    );
  }
  return <StaticStage song={song} />;
}

function StaticStage({ song }: { song: QueueItem }) {
  const [current, setCurrent] = useState(0);
  const duration = song.duration ?? 180;

  useEffect(() => {
    setCurrent(0);
    const t = setInterval(() => setCurrent((c) => c + 1), 1000);
    return () => clearInterval(t);
  }, [song.id]);

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <motion.div
      key={song.id}
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden bg-[radial-gradient(ellipse_at_center,var(--color-surface-strong),var(--color-surface-base))] p-6 text-center"
    >
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,var(--color-accent-glow),transparent_60%)] opacity-50" />
      <div className="relative">
        <AlbumArt
          song={song}
          className="h-56 w-56 max-w-[80vw] rounded-2xl border border-[#292929] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        />
      </div>
      <div className="relative flex max-w-xl flex-col items-center gap-2">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-accent">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_10px_var(--color-accent-glow)]" />
          Now Playing
        </p>
        <h2 className="text-3xl font-bold text-white sm:text-4xl">{song.title}</h2>
        <p className="text-lg text-text-tertiary">{song.artist}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-text-tertiary">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#292929] bg-surface-strong/60 px-2.5 py-1">
            <Music className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Karaoke track
          </span>
          {song.duration ? (
            <span>
              {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, "0")}
            </span>
          ) : null}
        </div>
      </div>
      <div className="relative mt-2 h-1 w-full max-w-64 overflow-hidden rounded-full bg-surface-strong">
        <div
          className="h-full rounded-full bg-accent shadow-[0_0_12px_var(--color-accent-glow)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}