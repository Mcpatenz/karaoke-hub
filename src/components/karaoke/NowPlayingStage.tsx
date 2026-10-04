"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { Music, SkipForward } from "lucide-react";
import type { QueueItem } from "@/stores/queueStore";
import { AlbumArt } from "./SongArt";
import { ModernVideoPlayer, type VideoPlayerHandle, type VideoPlayerState } from "./ModernVideoPlayer";

interface NowPlayingStageProps {
  song: QueueItem;
  onEnded?: () => void;
  onSkip?: () => void;
  playerRef?: RefObject<VideoPlayerHandle | null>;
  canSkip?: boolean;
  onStateChange?: (state: VideoPlayerState) => void;
}

export function NowPlayingStage({
  song,
  onEnded,
  onSkip,
  playerRef,
  canSkip = true,
  onStateChange,
}: NowPlayingStageProps) {
  if (song.videoId) {
    return (
      <motion.div
        key={song.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative h-full w-full"
      >
        <ModernVideoPlayer
          ref={playerRef}
          song={song}
          onEnded={onEnded}
          onSkip={onSkip}
          canSkip={canSkip}
          onStateChange={onStateChange}
        />
      </motion.div>
    );
  }
  return <StaticStage song={song} onEnded={onEnded} onSkip={onSkip} />;
}

function StaticStage({ song, onEnded, onSkip }: { song: QueueItem; onEnded?: () => void; onSkip?: () => void }) {
  const [current, setCurrent] = useState(0);
  const duration = song.duration ?? 180;
  const currentRef = useRef(0);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  useEffect(() => {
    currentRef.current = 0;
    endedRef.current = false;
    setCurrent(0);
    const t = setInterval(() => {
      const next = currentRef.current + 1;
      currentRef.current = next;
      setCurrent(Math.min(next, duration));
      if (next >= duration && !endedRef.current) {
        endedRef.current = true;
        onEndedRef.current?.();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [song.id, duration]);

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const finished = current >= duration;

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
          {finished ? "Finished" : "Now Playing"}
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
      <div className="relative mt-2 flex w-full max-w-64 flex-col items-center gap-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-strong">
          <div
            className="h-full rounded-full bg-accent shadow-[0_0_12px_var(--color-accent-glow)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        {onSkip && (
          <button
            type="button"
            onClick={() => onSkipRef.current?.()}
            className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-surface-base transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
            Next
          </button>
        )}
      </div>
    </motion.div>
  );
}