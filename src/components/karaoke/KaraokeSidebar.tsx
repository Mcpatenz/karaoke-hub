"use client";

import { useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListMusic, Search, Settings, Play, Pause, SkipForward, Plus, Minus, Volume2, VolumeX } from "lucide-react";
import { useQueueStore, type QueueItem } from "@/stores/queueStore";
import type { Song } from "@/stores/searchStore";
import type { VideoPlayerHandle } from "./ModernVideoPlayer";
import QueuePanel from "./QueuePanel";
import AddSongPanel from "./AddSongPanel";
import SettingsPanel, { type HostSettings } from "./SettingsPanel";

export type SidebarTab = "queue" | "add" | "settings";

interface KaraokeSidebarProps {
  queueCount: number;
  settings: HostSettings;
  onSettingsChange: (s: HostSettings) => void;
  onAddSong: (song: Song) => boolean;
  onViewSong: (item: QueueItem) => void;
  playerRef?: RefObject<VideoPlayerHandle | null>;
  isHost: boolean;
}

export default function KaraokeSidebar({
  queueCount,
  settings,
  onSettingsChange,
  onAddSong,
  onViewSong,
  playerRef,
  isHost,
}: KaraokeSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>("queue");
  const state = useQueueStore();

  const handleAddSong = (song: Song): boolean => onAddSong(song);

  return (
    <div className="flex h-full flex-col gap-4">
      <SidebarTabs tab={tab} onTab={setTab} queueCount={queueCount} />

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "queue" && (
              <QueuePanel
                isHost={isHost}
                onAddSong={() => setTab("add")}
                onViewSong={onViewSong}
              />
            )}
            {tab === "add" && (
              <AddSongPanel
                queueCount={queueCount}
                onBack={() => setTab("queue")}
                onAddSong={handleAddSong}
              />
            )}
            {tab === "settings" && (
              <SettingsPanel settings={settings} onChange={onSettingsChange} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <PlayerControls playerRef={playerRef} onSkip={state.skipCurrent} hasNowPlaying={!!state.nowPlaying} />
    </div>
  );
}

function SidebarTabs({
  tab,
  onTab,
  queueCount,
}: {
  tab: SidebarTab;
  onTab: (tab: SidebarTab) => void;
  queueCount: number;
}) {
  const tabs: {
    id: SidebarTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: "queue", label: `Queue (${queueCount})`, icon: <ListMusic className="h-4 w-4" aria-hidden="true" /> },
    { id: "add", label: "Add Song", icon: <Search className="h-4 w-4" aria-hidden="true" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" aria-hidden="true" /> },
  ];

  return (
    <div className="grid grid-cols-3 gap-1 rounded-[var(--radius-sm)] border border-border-default bg-[#181818] p-1">
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            aria-pressed={active}
            className={`flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-[var(--radius-xs)] px-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-accent ${
              active
                ? "border border-accent bg-accent/10 text-accent shadow-[0_0_16px_var(--color-accent-glow)]"
                : "border border-transparent text-text-tertiary hover:bg-surface-raised hover:text-text-primary"
            }`}
          >
            <span className={active ? "text-accent" : ""}>{t.icon}</span>
            <span className="truncate">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PlayerControls({
  playerRef,
  onSkip,
  hasNowPlaying,
}: {
  playerRef?: RefObject<VideoPlayerHandle | null>;
  onSkip: () => void;
  hasNowPlaying: boolean;
}) {
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  const p = () => playerRef?.current;

  const handleTogglePlay = () => {
    const next = !playing;
    setPlaying(next);
    p()?.togglePlay();
  };

  const handleVolume = (delta: number) => {
    const next = Math.min(100, Math.max(0, volume + delta));
    setVolume(next);
    p()?.changeVolume(next);
    if (next > 0 && muted) {
      setMuted(false);
      p()?.toggleMute();
    }
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    p()?.toggleMute();
    if (!next) setVolume(70);
  };

  const ctrl =
    "grid h-9 w-9 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-all hover:scale-105 hover:text-accent hover:bg-accent/10 hover:shadow-[0_0_12px_var(--color-accent-glow)] disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div className="flex items-center justify-between gap-0.5 rounded-[var(--radius-xs)] border border-border-default bg-[#181818] p-1.5">
      <button
        type="button"
        disabled={!hasNowPlaying}
        onClick={handleTogglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="grid h-9 w-9 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] bg-accent text-text-inverse transition-all hover:scale-105 hover:bg-accent-hover hover:shadow-[0_0_16px_var(--color-accent-glow)] disabled:pointer-events-none disabled:opacity-30"
      >
        {playing ? (
          <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
        )}
      </button>
      <button type="button" disabled={!hasNowPlaying} onClick={onSkip} aria-label="Next" className={ctrl}>
        <SkipForward className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="mx-1 h-9 w-px bg-border-default" aria-hidden="true" />
      <button
        type="button"
        onClick={handleToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className={ctrl}
      >
        {muted ? (
          <VolumeX className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Volume2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        disabled={volume <= 0}
        onClick={() => handleVolume(-10)}
        aria-label="Decrease volume"
        className={ctrl}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="w-8 text-center text-xs font-medium text-text-tertiary">{volume}%</span>
      <button
        type="button"
        disabled={volume >= 100}
        onClick={() => handleVolume(10)}
        aria-label="Increase volume"
        className={ctrl}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
