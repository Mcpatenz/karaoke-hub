"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import type { QueueItem } from "@/stores/queueStore";
import { AlbumArt } from "./SongArt";

interface NowPlayingProps {
  song: QueueItem;
  onSkip: () => void;
  onPrevious: () => void;
  onTogglePlay: () => void;
}

export default function NowPlaying({
  song,
  onSkip,
  onPrevious,
  onTogglePlay,
}: NowPlayingProps) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const duration = song.duration ?? 180;

  useEffect(() => {
    setCurrent(0);
    setPlaying(false);
    timer.current = setInterval(() => {
      setCurrent((t) => t + 1);
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [song.id]);

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-[var(--radius-sm)] border border-accent/30 bg-accent/[0.06] p-4"
    >
      <div className="flex items-start gap-3">
        <AlbumArt song={song} className="h-12 w-12 rounded-[var(--radius-xs)]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-left text-sm font-semibold text-white">{song.title}</p>
          <p className="truncate text-left text-xs text-text-tertiary">{song.artist}</p>
          <p className="truncate text-left text-[11px] text-text-tertiary">Added by {song.addedBy}</p>
        </div>
      </div>

      <div
        role="slider"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={Math.round(current)}
        className="mt-3 relative h-1 w-full cursor-pointer rounded-full bg-surface-strong"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent-glow)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-text-tertiary">
        <span>{formatTime(current)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <IconBtn label="Previous" onClick={onPrevious}>
          <SkipBack className="h-4 w-4" aria-hidden="true" />
        </IconBtn>
        <IconBtn
          label={playing ? "Pause" : "Play"}
          onClick={() => {
            setPlaying((p) => !p);
            onTogglePlay();
          }}
          accent
        >
          {playing ? (
            <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5 fill-current" aria-hidden="true" />
          )}
        </IconBtn>
        <IconBtn label="Next / skip" onClick={onSkip}>
          <SkipForward className="h-4 w-4" aria-hidden="true" />
        </IconBtn>
      </div>
    </motion.div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  accent = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-[var(--radius-xs)] transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
        accent
          ? "bg-accent text-text-inverse"
          : "text-text-tertiary hover:bg-surface-strong hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
