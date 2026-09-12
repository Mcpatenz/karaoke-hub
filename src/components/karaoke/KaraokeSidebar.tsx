"use client";

import { useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListMusic, Search, Settings, Users, Play, Pause, SkipForward, Plus, Minus, Volume2, VolumeX } from "lucide-react";
import { useRoomStore } from "@/stores/roomStore";
import { useQueueStore, type QueueItem } from "@/stores/queueStore";
import { roomApi } from "@/lib/roomApi";
import { useToast } from "@/components/ui/Toast";
import type { Song } from "@/stores/searchStore";
import type { VideoPlayerHandle } from "./ModernVideoPlayer";
import QueuePanel from "./QueuePanel";
import AddSongPanel from "./AddSongPanel";
import SettingsPanel, { type HostSettings } from "./SettingsPanel";
import GuestList from "./GuestList";

export type SidebarTab = "queue" | "add" | "settings" | "guests";

interface KaraokeSidebarProps {
  roomCode: string;
  queueCount: number;
  settings: HostSettings;
  onSettingsChange: (s: HostSettings) => void;
  onAddSong: (song: Song) => boolean;
  onViewSong: (item: QueueItem) => void;
  playerRef?: RefObject<VideoPlayerHandle | null>;
  isHost: boolean;
}

export default function KaraokeSidebar({
  roomCode,
  queueCount,
  settings,
  onSettingsChange,
  onAddSong,
  onViewSong,
  playerRef,
  isHost,
}: KaraokeSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>("queue");
  const queue = useQueueStore();
  const room = useRoomStore();

  const handleAddSong = (song: Song): boolean => onAddSong(song);

  return (
    <div className="flex h-full flex-col gap-4">
      <SidebarTabs
        tab={tab}
        onTab={setTab}
        queueCount={queueCount}
        pendingCount={room.pendingGuests.length}
        isHost={isHost}
      />

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
                roomCode={roomCode}
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
            {tab === "guests" && (
              <GuestPanel roomCode={roomCode} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {isHost && (
        <PlayerControls
          playerRef={playerRef}
          onSkip={() => {
            const st = useRoomStore.getState();
            if (st.hostToken) void roomApi.queueControl(roomCode, st.hostToken, "skip");
          }}
          hasNowPlaying={!!queue.nowPlaying}
        />
      )}
    </div>
  );
}

function GuestPanel({ roomCode }: { roomCode: string }) {
  const room = useRoomStore();
  const { toast } = useToast();

  const handleApprove = async (id: string) => {
    const guest = room.pendingGuests.find((g) => g.id === id);
    if (!room.hostToken) return;
    const ok = await roomApi.approveGuest(roomCode, room.hostToken, id);
    if (ok) toast(guest ? `${guest.name} approved` : "Guest approved");
    else toast("Could not approve request", "error");
  };

  const handleDeny = async (id: string) => {
    const guest = room.pendingGuests.find((g) => g.id === id);
    if (!room.hostToken) return;
    const ok = await roomApi.denyGuest(roomCode, room.hostToken, id);
    if (ok) toast(guest ? `${guest.name} denied` : "Request denied", "error");
    else toast("Could not deny request", "error");
  };

  const handleRemove = async (id: string) => {
    const guest = room.guests.find((g) => g.id === id);
    if (!room.hostToken) return;
    const ok = await roomApi.removeGuest(roomCode, room.hostToken, id);
    if (ok) toast(guest ? `${guest.name} removed` : "Guest removed");
    else toast("Could not remove guest", "error");
  };

  return (
    <GuestList
      guests={room.guests}
      pendingGuests={room.pendingGuests}
      isHost
      onApprove={handleApprove}
      onDeny={handleDeny}
      onRemove={handleRemove}
    />
  );
}

function SidebarTabs({
  tab,
  onTab,
  queueCount,
  pendingCount,
  isHost,
}: {
  tab: SidebarTab;
  onTab: (tab: SidebarTab) => void;
  queueCount: number;
  pendingCount: number;
  isHost: boolean;
}) {
  const tabs: {
    id: SidebarTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: "queue", label: `Queue (${queueCount})`, icon: <ListMusic className="h-4 w-4" aria-hidden="true" /> },
    { id: "add", label: "Add Song", icon: <Search className="h-4 w-4" aria-hidden="true" /> },
    ...(isHost
      ? [{ id: "guests" as SidebarTab, label: `Guests`, icon: <Users className="h-4 w-4" aria-hidden="true" />, badge: pendingCount }]
      : []),
    ...(isHost
      ? [{ id: "settings" as SidebarTab, label: "Settings", icon: <Settings className="h-4 w-4" aria-hidden="true" /> }]
      : []),
  ];

  const cols = isHost ? "grid-cols-4" : "grid-cols-2";

  return (
    <div className={`grid ${cols} gap-1 rounded-[var(--radius-sm)] border border-border-default bg-[#181818] p-1`}>
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            aria-pressed={active}
            className={`relative flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-[var(--radius-xs)] px-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-accent ${
              active
                ? "border border-accent bg-accent/10 text-accent shadow-[0_0_16px_var(--color-accent-glow)]"
                : "border border-transparent text-text-tertiary hover:bg-surface-raised hover:text-text-primary"
            }`}
          >
            <span className={active ? "text-accent" : ""}>{t.icon}</span>
            <span className="truncate">{t.label}</span>
            {t.badge != null && t.badge > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-error px-1 text-[9px] font-bold text-white">
                {t.badge}
              </span>
            )}
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
