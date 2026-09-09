"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { LogOut, Mic, Monitor, Users } from "lucide-react";
import { useRoomStore } from "@/stores/roomStore";
import { useQueueStore, type QueueItem } from "@/stores/queueStore";
import type { Song } from "@/stores/searchStore";
import { useToast } from "@/components/ui/Toast";
import WaitingScreen from "@/components/karaoke/WaitingScreen";
import { NowPlayingStage } from "@/components/karaoke/NowPlayingStage";
import KaraokeSidebar from "@/components/karaoke/KaraokeSidebar";
import { DEFAULT_SETTINGS, type HostSettings } from "@/components/karaoke/SettingsPanel";
import type { VideoPlayerHandle } from "@/components/karaoke/ModernVideoPlayer";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface KaraokeHostRoomProps {
  roomCode: string;
  hostName: string;
}

export default function KaraokeHostRoom({ roomCode, hostName }: KaraokeHostRoomProps) {
  const { toast } = useToast();
  const room = useRoomStore();
  const queue = useQueueStore();
  const [settings, setSettings] = useState<HostSettings>(DEFAULT_SETTINGS);
  const playerRef = useRef<VideoPlayerHandle | null>(null);

  const queueCount = queue.upcoming.length;

  useEffect(() => {
    if (room.guests.length > 0) return;
    const mocks = [
      { id: "g-seed-1", name: "Ava", isHost: false },
      { id: "g-seed-2", name: "Leo", isHost: false },
      { id: "g-seed-3", name: "Mia", isHost: false },
    ];
    mocks.forEach((g) => room.addGuest(g));
  }, [room]);

  const handleSettingsChange = (next: HostSettings) => {
    setSettings(next);
    toast("Settings updated");
  };

  const handleAddSong = (song: Song): boolean => {
    const normalized = song.title.trim().toLowerCase();
    const inQueue = [queue.nowPlaying, ...queue.upcoming]
      .filter((i): i is QueueItem => i !== null)
      .some((i) => i.title.toLowerCase() === normalized);

    if (settings.allowDuplicates === false && inQueue) {
      toast(`"${song.title}" is already in the queue`, "error");
      return false;
    }

    if (settings.guestQueueLimit > 0) {
      const addedBy = hostName;
      const count =
        (queue.nowPlaying?.addedBy === addedBy ? 1 : 0) +
        queue.upcoming.filter((i) => i.addedBy === addedBy).length;
      if (count >= settings.guestQueueLimit) {
        toast("Queue limit reached for this host", "error");
        return false;
      }
    }

    const item: QueueItem = {
      id: `q-${Math.random().toString(36).slice(2, 10)}`,
      songId: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      artwork: song.artwork,
      duration: song.duration,
      videoId: song.videoId,
      channel: song.channel,
      addedBy: hostName,
    };

    queue.addToQueue(item);
    toast(`"${song.title}" added to queue (${queue.upcoming.length + 1} queued)`);

    return true;
  };

  const handleViewSong = (item: QueueItem) => {
    // Preview of a queued song — no-op keeps the preview drawer reachable.
    void item;
  };

  const participantCount = room.guests.length + 1;

  return (
    <div className="stage-bg relative flex h-[100dvh] flex-col overflow-hidden text-white">
      <HostHeader
        roomCode={roomCode}
        participantCount={participantCount}
        onEndSession={() => {}}
      />

      <div className="relative z-10 flex min-h-0 flex-1">
        {/* Main stage */}
        <section
          aria-label="Karaoke stage"
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden border-r border-[#262636]"
        >
          <motion.div
            key={queue.nowPlaying ? "playing" : "waiting"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative min-h-0 flex-1"
          >
            {queue.nowPlaying ? (
              <NowPlayingStage
                song={queue.nowPlaying}
                playerRef={playerRef}
                onEnded={() => {
                  if (settings.autoplayNext) queue.completeCurrent();
                }}
              />
            ) : (
              <WaitingScreen roomCode={roomCode} guestCount={participantCount} />
            )}
          </motion.div>
        </section>

        {/* Right sidebar */}
        <aside
          aria-label="Karaoke controls"
          className="flex w-full max-w-[360px] shrink-0 flex-col overflow-y-auto border-l border-[#262636] bg-surface-base/40 p-4 backdrop-blur-2xl md:max-w-[320px] lg:max-w-[360px]"
        >
          <KaraokeSidebar
            queueCount={queueCount}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onAddSong={handleAddSong}
            onViewSong={handleViewSong}
            playerRef={playerRef}
            isHost
          />
        </aside>
      </div>
    </div>
  );
}

interface HostHeaderProps {
  roomCode: string;
  participantCount: number;
  onEndSession: () => void;
}

function HostHeader({ roomCode, participantCount, onEndSession }: HostHeaderProps) {
  return (
    <header className="glass-strong relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] bg-accent shadow-[0_0_16px_var(--color-accent-glow)]">
          <Mic className="h-4 w-4 text-surface-base" aria-hidden="true" />
        </span>
        <span className="text-sm font-bold tracking-wide sm:text-base">
          Karaoke<span className="text-accent">Hub</span>
        </span>
        <RoomPill code={roomCode} />
        <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-text-tertiary sm:inline-flex">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {participantCount}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          onClick={onEndSession}
          className="inline-flex h-9 min-h-[44px] items-center gap-1.5 rounded-[var(--radius-xs)] px-3 text-sm text-text-tertiary transition-colors hover:bg-status-error/10 hover:text-status-error focus-visible:outline-2 focus-visible:outline-accent"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          End Session
        </Link>
        <Monitor className="hidden h-4 w-4 text-text-tertiary sm:block" aria-hidden="true" />
      </div>
    </header>
  );
}

function RoomPill({ code }: { code: string }) {
  return (
    <span className="inline-flex rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-accent shadow-[0_0_12px_var(--color-accent-glow)]">
      Room: {code}
    </span>
  );
}
