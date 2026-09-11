"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Gauge,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { QueueItem } from "@/stores/queueStore";

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (v: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setPlaybackRate: (r: number) => void;
  getPlaybackRate: () => number;
  destroy: () => void;
  getPlayerState: () => number;
}

interface YoutubeHost {
  YT?: {
    Player: new (
      host: HTMLElement,
      opts: {
        videoId: string;
        width?: string;
        height?: string;
        playerVars?: Record<string, unknown>;
        events?: Record<string, (e: { data?: number }) => void>;
      },
    ) => YouTubePlayer;
  };
  onYouTubeIframeAPIReady?: () => void;
}

declare global {
  interface Window {
    YT?: YoutubeHost["YT"];
    onYouTubeIframeAPIReady?: () => void;
    __ytIframeApiPromise?: Promise<boolean>;
  }
}

const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;
type PlayState = "buffering" | "playing" | "paused" | "ended";

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface ModernVideoPlayerProps {
  song: QueueItem;
  onEnded?: () => void;
}

export interface VideoPlayerHandle {
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  seekBy: (delta: number) => void;
  skip: () => void;
  toggleMute: () => void;
  changeVolume: (v: number) => void;
}

export const ModernVideoPlayer = forwardRef<VideoPlayerHandle, ModernVideoPlayerProps>(
  function ModernVideoPlayer({ song, onEnded }, ref) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [playState, setPlayState] = useState<PlayState>("buffering");
  const [error, setError] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(song.duration ?? 0);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const playStateRef = useRef(playState);
  playStateRef.current = playState;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const endedRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const showControls = () => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playStateRef.current === "playing") {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 2600);
    }
  };

  const dumpEnded = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    onEndedRef.current?.();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host || !song.videoId) return;

    const apiPromise =
      window.__ytIframeApiPromise ?? (window.__ytIframeApiPromise = loadIframeApi());

    let fallbackTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      if (!cancelled && !window.YT?.Player) setReady(true);
    }, 12000);

    apiPromise.then(() => {
      if (cancelled || !window.YT?.Player) return;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      const player = new window.YT.Player(host, {
        videoId: song.videoId!,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
        },
        events: {
          onError: () => {
            if (cancelled) return;
            setError(true);
            setReady(true);
          },
          onReady: () => {
            if (cancelled) return;
            playerRef.current = player;
            player.setVolume(volumeRef.current);
            setReady(true);
            player.playVideo();
          },
          onStateChange: (e) => {
            if (cancelled) return;
            const st = e.data;
            if (st === YT_STATE.BUFFERING) {
              if (playStateRef.current !== "ended") setPlayState("buffering");
              showControls();
            } else if (st === YT_STATE.PLAYING) {
              setPlayState("playing");
              showControls();
            } else if (st === YT_STATE.PAUSED) {
              setPlayState("paused");
              showControls();
            } else if (st === YT_STATE.ENDED) {
              setPlayState("ended");
              const p = playerRef.current;
              if (p) {
                setTime(p.getDuration());
                setDuration(p.getDuration());
              }
              showControls();
              dumpEnded();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      try {
        playerRef.current?.destroy();
      } catch {
        /* already destroyed */
      }
      playerRef.current = null;
      endedRef.current = false;
      setError(false);
    };
  }, [song.videoId, dumpEnded]);

  const isPlaying = playState === "playing";

  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const tick = () => {
      const p = playerRef.current;
      if (p) {
        const dur = p.getDuration();
        if (dur && dur !== duration) setDuration(dur);
        setTime(p.getCurrentTime());
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, duration]);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playState === "playing") {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 2600);
    } else {
      setControlsVisible(true);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [playState]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playState === "playing") {
      p.pauseVideo();
    } else {
      endedRef.current = false;
      p.playVideo();
    }
    showControls();
  };

  const seekBy = (delta: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(Math.max(0, Math.min(p.getDuration(), p.getCurrentTime() + delta)), true);
    if (playState === "paused" || playState === "ended") {
      endedRef.current = false;
      p.playVideo();
    }
    showControls();
  };

  const skipSong = () => {
    dumpEnded();
    showControls();
  };

  const clickRate = (r: number) => {
    setRate(r);
    playerRef.current?.setPlaybackRate(r);
    setSpeedOpen(false);
  };

  const toggleVolume = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) p.unMute();
    else p.mute();
    setMuted(p.isMuted());
    showControls();
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    const p = playerRef.current;
    if (p) {
      p.setVolume(v);
      if (v > 0 && p.isMuted()) p.unMute();
      setMuted(p.isMuted());
    }
  };

  const toggleFullscreen = async () => {
    const el = wrapperRef.current;
    try {
      if (!document.fullscreenElement) {
        await el?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* unsupported */
    }
  };

  const seekRatio = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const onSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = seekBarRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    setDragging(true);
    const ratio = seekRatio(e.clientX, el);
    setScrub(ratio * duration);
  };
  const onSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = seekBarRef.current;
    if (!el) return;
    if (dragging) {
      setScrub(seekRatio(e.clientX, el) * duration);
    } else {
      setScrub(seekRatio(e.clientX, el) * duration);
    }
  };
  const onSeekPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = seekBarRef.current;
    if (!el) return;
    if (dragging) el.releasePointerCapture(e.pointerId);
    setDragging(false);
    const target = seekRatio(e.clientX, el) * duration;
    const p = playerRef.current;
    if (p) {
      p.seekTo(target, true);
      setTime(target);
    }
    setScrub(null);
    if (playStateRef.current === "paused") {
      endedRef.current = false;
      p?.playVideo();
    }
    showControls();
  };

  const effectiveTime = dragging && scrub !== null ? scrub : time;
  const progress = duration > 0 ? Math.min(1, effectiveTime / duration) : 0;
  const activeTime = scrub ?? effectiveTime;

  useImperativeHandle(ref, () => ({
    togglePlay,
    play: () => {
      endedRef.current = false;
      playerRef.current?.playVideo();
      showControls();
    },
    pause: () => {
      playerRef.current?.pauseVideo();
      showControls();
    },
    seekBy,
    skip: skipSong,
    toggleMute: toggleVolume,
    changeVolume,
  }));

  return (
    <div
      ref={wrapperRef}
      className="group relative h-full w-full overflow-hidden bg-black"
      onMouseMove={showControls}
      onMouseLeave={() => {
        if (playState === "playing" && !dragging) setControlsVisible(false);
      }}
    >
      {/* YouTube host slot (replaced by the player iframe) */}
      <div ref={hostRef} className="absolute inset-0" />

      {/* Loading spinner until the player signals ready */}
      {!ready && !error ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-surface-strong border-t-accent" />
            <p className="text-sm text-text-tertiary">Loading karaoke video…</p>
          </div>
        </div>
      ) : null}

      {/* Error overlay — video unavailable */}
      {error ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 gap-4 px-6 text-center">
          <AlertTriangle className="h-10 w-10 text-status-error" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold text-white">Video Unavailable</p>
            <p className="mt-1 text-sm text-text-tertiary">
              This video cannot be played. It may have been removed or restricted.
            </p>
          </div>
          <button
            type="button"
            onClick={skipSong}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-surface-base transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
            Skip Song
          </button>
        </div>
      ) : null}

      {/* Buffering spinner */}
      {ready && playState === "buffering" ? (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-surface-strong border-t-accent" />
        </div>
      ) : null}

      {/* Top info overlay */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/85 via-black/45 to-transparent p-3 pb-14 transition-all duration-300 sm:p-5 sm:pb-16 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-accent">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_10px_var(--color-accent-glow)]" />
          Now Playing
        </p>
        <h2 className="mt-2 truncate text-2xl font-bold text-white sm:text-3xl">{song.title}</h2>
        <p className="mt-1 truncate text-sm text-text-tertiary sm:text-base">
          {song.artist}
          {song.channel ? ` • ${song.channel}` : ""}
        </p>
        <p className="mt-0.5 truncate text-xs text-text-tertiary sm:text-sm">Added by {song.addedBy}</p>
      </div>

      {/* Center play / replay */}
      {ready && playState !== "playing" && playState !== "buffering" ? (
        <button
          type="button"
          aria-label={playState === "ended" ? "Play again" : "Play"}
          onClick={togglePlay}
          className={`absolute left-1/2 top-[46%] z-20 mb-4 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-accent/60 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent sm:h-20 sm:w-20 ${
            controlsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {playState === "ended" ? (
            <RotateCcw className="h-9 w-9" aria-hidden="true" />
          ) : (
            <Play className="h-10 w-10 translate-x-0.5 fill-current" aria-hidden="true" />
          )}
        </button>
      ) : null}

      {/* Control bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-14 transition-all duration-300 ${
          controlsVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {/* Progress bar */}
        <div
          ref={seekBarRef}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(activeTime)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") seekBy(-10);
            if (e.key === "ArrowRight") seekBy(10);
          }}
          onPointerDown={onSeekPointerDown}
          onPointerMove={onSeekPointerMove}
          onPointerUp={onSeekPointerUp}
          onPointerCancel={onSeekPointerUp}
          className="group/bar relative h-5 cursor-pointer touch-none"
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent-glow)]"
              style={{ width: `${(dragging || scrub !== null ? (scrub ?? time) / (duration || 1) : progress) * 100}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/10"
              style={{ width: `${progress * 100}%` }}
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent-glow)] transition-transform group-hover/bar:scale-125"
              style={{ left: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex flex-wrap items-center gap-1">
          <CtlBtn label={playState === "playing" ? "Pause" : "Play"} onClick={togglePlay} primary>
            {playState === "playing" ? (
              <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
            ) : (
              <Play className="h-5 w-5 translate-x-0.5 fill-current" aria-hidden="true" />
            )}
          </CtlBtn>
          <CtlBtn label="Replay 10 seconds" onClick={() => seekBy(-10)} className="max-sm:hidden">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </CtlBtn>
          <CtlBtn label="Forward 10 seconds" onClick={() => seekBy(10)} className="max-sm:hidden">
            <RotateCw className="h-4 w-4" aria-hidden="true" />
          </CtlBtn>
          <CtlBtn label="Skip song" onClick={skipSong}>
            <SkipForward className="h-4 w-4" aria-hidden="true" />
          </CtlBtn>

          <div className="ml-1 min-w-0 whitespace-nowrap select-none text-xs tabular-nums text-white/90">
            {formatTime(activeTime)}
            <span className="mx-1 text-white/40">/</span>
            <span className="text-white/60">{formatTime(duration)}</span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {/* Volume */}
            <div
              className="relative"
              onMouseEnter={() => setVolumeOpen(true)}
              onMouseLeave={() => setVolumeOpen(false)}
            >
              <CtlBtn label={muted ? "Unmute" : "Mute"} onClick={toggleVolume}>
                {muted ? (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                )}
              </CtlBtn>
              <div
                className={`absolute bottom-12 right-0 hidden w-8 flex-col items-center gap-2 rounded-xl border border-border-default bg-[#141414] p-2 shadow-xl sm:flex ${
                  controlsVisible && volumeOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  aria-label="Volume"
                  className="h-24 w-1.5 -rotate-180 accent-accent"
                  style={{ writingMode: "vertical-lr", direction: "rtl" }}
                />
                <span className="text-[10px] tabular-nums text-text-tertiary">{volume}</span>
              </div>
            </div>

            {/* Playback rate */}
            <div className="relative">
              <CtlBtn label="Playback speed" onClick={() => setSpeedOpen((o) => !o)}>
                <span className="flex items-center gap-1 text-xs font-semibold">
                  <Gauge className="h-4 w-4" aria-hidden="true" />
                  {rate.toFixed(2).replace(/0$/, "").replace(/(\.\d)0$/, "$1")}x
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                </span>
              </CtlBtn>
              {speedOpen ? (
                <div className="absolute bottom-12 right-0 z-30 flex flex-col gap-0.5 rounded-xl border border-border-default bg-[#141414] p-1.5 shadow-xl">
                  {RATES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => clickRate(r)}
                      className={`rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                        r === rate
                          ? "bg-accent/15 text-accent"
                          : "text-white/80 hover:bg-surface-strong"
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <CtlBtn
              label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              onClick={toggleFullscreen}
            >
              {fullscreen ? (
                <Minimize className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Maximize className="h-4 w-4" aria-hidden="true" />
              )}
            </CtlBtn>
          </div>
        </div>
      </div>
    </div>
  );
  }
);

function CtlBtn({
  label,
  onClick,
  children,
  primary = false,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid h-10 w-10 min-h-[44px] min-w-[44px] place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
        primary
          ? "bg-white/10 text-white hover:bg-accent hover:text-text-inverse"
          : "text-white/80 hover:bg-white/10 hover:text-accent"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function loadIframeApi(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(true);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    const timer = setTimeout(() => {
      window.__ytIframeApiPromise = undefined;
      resolve(false);
    }, 12000);
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      clearTimeout(timer);
      resolve(Boolean(window.YT?.Player));
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  });
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}