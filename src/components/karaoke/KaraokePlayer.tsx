"use client";

import { useEffect } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Loader2, AlertTriangle } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import Button from "@/components/ui/Button";

interface KaraokePlayerProps {
  songTitle?: string;
  songArtist?: string;
  className?: string;
}

const SEEK_STEP = 10;

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function KaraokePlayer({ songTitle, songArtist, className = "" }: KaraokePlayerProps) {
  const {
    state,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    setState,
    setCurrentTime,
    toggleMute,
    toggleFullscreen,
  } = usePlayerStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if (state === "idle" || state === "error") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setState(state === "playing" ? "paused" : "playing");
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCurrentTime(Math.max(0, currentTime - SEEK_STEP));
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentTime(Math.min(duration || currentTime, currentTime + SEEK_STEP));
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state, currentTime, duration, setState, setCurrentTime, toggleMute, toggleFullscreen]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const canPlay = state === "playing" || state === "paused" || state === "buffering";

  return (
    <section
      aria-label="Karaoke player"
      className={[
        "overflow-hidden rounded-[var(--radius-sm)] border border-border-default bg-black",
        className,
      ].join(" ")}
    >
      {/* Stage / video area */}
      <div className="relative flex aspect-video items-center justify-center bg-surface-muted">
        {state === "loading" && (
          <div className="flex items-center gap-3" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
            <p className="text-sm text-text-tertiary">Loading karaoke...</p>
          </div>
        )}
        {state === "error" && (
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <AlertTriangle className="h-8 w-8 text-status-error" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-text-primary">Unable to play this song.</p>
              <p className="mt-1 text-xs text-text-tertiary">
                The video source may be unavailable.
              </p>
            </div>
            <Button
              onClick={() => {
                setState("playing");
              }}
            >
              Try Again
            </Button>
          </div>
        )}
        {(state === "idle" || state === "ended") && (
          <div className="px-6 text-center">
            {songTitle ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
                  Now Playing
                </p>
                <p className="mt-2 truncate text-lg font-bold text-text-primary">{songTitle}</p>
                {songArtist && <p className="text-sm text-text-tertiary">{songArtist}</p>}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">Nothing playing yet. Queue a song to get started.</p>
            )}
          </div>
        )}
        {canPlay && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-text-tertiary">
            {state === "buffering" ? "Buffering..." : "♪ Sing along"}
          </p>
        )}

        {isFullscreen && (
          <span className="sr-only">Fullscreen mode active. Press Escape to exit.</span>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-border-default bg-surface-raised px-4 py-3">
        <div className="mx-1 mb-3">
          <div
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration || 0)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            className="relative h-1 w-full cursor-pointer rounded-full bg-surface-strong"
            tabIndex={canPlay ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setCurrentTime(Math.max(0, currentTime - 5));
              if (e.key === "ArrowRight") setCurrentTime(Math.min(duration || currentTime, currentTime + 5));
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent-glow)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-text-tertiary">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setCurrentTime(Math.max(0, currentTime - SEEK_STEP))}
            disabled={state === "idle" || state === "error"}
            aria-label="Skip back 10 seconds"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-surface-strong hover:text-text-primary disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <SkipBack className="h-5 w-5" aria-hidden="true" />
          </button>

          <Button
            size="md"
            variant="primary"
            aria-label={state === "playing" ? "Pause song" : "Play song"}
            onClick={() => {
              if (state === "idle") setState("playing");
              else if (state === "paused") setState("playing");
              else setState("paused");
            }}
            className="h-[52px] w-[52px] rounded-full !p-0"
          >
            {state === "playing" ? (
              <Pause className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Play className="h-5 w-5 translate-x-0.5" aria-hidden="true" />
            )}
          </Button>

          <button
            onClick={() => setCurrentTime(Math.min(duration || currentTime, currentTime + SEEK_STEP))}
            disabled={state === "idle" || state === "error"}
            aria-label="Skip forward 10 seconds"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-surface-strong hover:text-text-primary disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <SkipForward className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute player" : "Mute player"}
            aria-pressed={isMuted}
            className="flex min-h-[44px] items-center gap-2 rounded-[var(--radius-xs)] px-2 text-text-tertiary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            )}
            <span className="hidden text-xs sm:inline">
              {isMuted ? "Muted" : `${Math.round(volume * 100)}%`}
            </span>
          </button>

          <button
            onClick={toggleFullscreen}
            aria-label="Enter fullscreen"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Maximize className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}