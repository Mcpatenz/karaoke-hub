"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { LogOut, Mic, Monitor, Users, Clock, XCircle } from "lucide-react";
import { useRoomStore } from "@/stores/roomStore";
import { useQueueStore, type QueueItem } from "@/stores/queueStore";
import type { Song } from "@/stores/searchStore";
import { roomApi } from "@/lib/roomApi";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { useToast } from "@/components/ui/Toast";
import WaitingScreen from "@/components/karaoke/WaitingScreen";
import { NowPlayingStage } from "@/components/karaoke/NowPlayingStage";
import KaraokeSidebar from "@/components/karaoke/KaraokeSidebar";
import type { HostSettings } from "@/lib/roomSettings";
import type { VideoPlayerHandle, VideoPlayerState } from "@/components/karaoke/ModernVideoPlayer";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const IDLE_PLAYER_STATE: VideoPlayerState = { playState: "idle", volume: 100, muted: false };

interface KaraokeHostRoomProps {
  roomCode: string;
}

export default function KaraokeHostRoom({ roomCode }: KaraokeHostRoomProps) {
  const { toast } = useToast();
  const room = useRoomStore();
  const queue = useQueueStore();
  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const [playerState, setPlayerState] = useState<VideoPlayerState>(IDLE_PLAYER_STATE);

  useRoomRealtime(roomCode);

  const { isHost, guestStatus, settings, hostToken, guestId } = room;
  const queueCount = queue.upcoming.length;

  useEffect(() => {
    if (!queue.nowPlaying) setPlayerState(IDLE_PLAYER_STATE);
  }, [queue.nowPlaying]);

  /** Moves the queue on by one entry. Works while idle so the host can start
   *  the first song from the Next button. */
  const advanceQueue = useCallback(
    async (control: "skip" | "complete") => {
      const token = useRoomStore.getState().hostToken;
      if (!isHost || !token) return false;
      return roomApi.queueControl(roomCode, token, control);
    },
    [isHost, roomCode],
  );

  const handleSettingsChange = async (next: HostSettings) => {
    if (!isHost || !hostToken) return;
    const ok = await roomApi.updateSettings(roomCode, hostToken, next);
    if (ok) toast("Settings updated");
    else toast("Failed to update settings", "error");
  };

  const handleAddSong = (song: Song): boolean => {
    const addedBy = isHost ? room.hostName : room.guestName;
    const normalized = song.title.trim().toLowerCase();
    const inQueue = [queue.nowPlaying, ...queue.upcoming]
      .filter((i): i is QueueItem => i !== null)
      .some((i) => i.title.toLowerCase() === normalized);

    if (!settings.allowDuplicates && inQueue) {
      toast(`"${song.title}" is already in the queue`, "error");
      return false;
    }

    if (!isHost && settings.guestQueueLimit > 0) {
      const count =
        (queue.nowPlaying?.addedBy === addedBy ? 1 : 0) +
        queue.upcoming.filter((i) => i.addedBy === addedBy).length;
      if (count >= settings.guestQueueLimit) {
        toast("Queue limit reached", "error");
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
      addedBy,
    };

    void (async () => {
      const res = await roomApi.addSong(
        roomCode,
        item,
        isHost ? { hostToken: hostToken ?? undefined } : { guestId: guestId ?? undefined },
      );
      if (res.ok) toast(`"${song.title}" added to queue`);
      else toast(res.error ?? "Could not add song", "error");
    })();

    return true;
  };

  const handleEndSession = async () => {
    if (isHost && hostToken) {
      await roomApi.endRoom(roomCode, hostToken);
      roomApi.clearHostIdentity(roomCode);
    } else if (guestId) {
      await roomApi.leaveRoom(roomCode, guestId);
      roomApi.clearGuestIdentity(roomCode);
    }
    useRoomStore.getState().reset();
  };

  const participantCount = room.guests.length + 1;

  if (!isHost && (guestStatus === "pending" || guestStatus === "idle")) {
    return <GuestWaitingScreen roomCode={roomCode} guestName={room.guestName} />;
  }

  if (!isHost && guestStatus === "denied") {
    return <GuestDeniedScreen />;
  }

  return (
    <div className="stage-bg relative flex h-[100dvh] flex-col overflow-hidden text-white">
      <HostHeader
        roomCode={roomCode}
        participantCount={participantCount}
        isHost={isHost}
        hostName={room.hostName}
        onEndSession={handleEndSession}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Main stage */}
        <section
          aria-label="Karaoke stage"
          className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-b md:border-b-0 md:border-r border-[#262636]"
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
                canSkip={isHost}
                onStateChange={setPlayerState}
                onEnded={() => {
                  if (settings.autoplayNext) void advanceQueue("complete");
                }}
                onSkip={
                  isHost
                    ? () => {
                        void advanceQueue("skip");
                      }
                    : undefined
                }
              />
            ) : (
              <WaitingScreen roomCode={roomCode} guestCount={participantCount} />
            )}
          </motion.div>
        </section>

        {/* Right sidebar */}
        <aside
          aria-label="Karaoke controls"
          className="flex h-[40dvh] md:h-auto min-h-0 w-full shrink-0 flex-col overflow-hidden md:overflow-y-auto border-t md:border-t-0 md:border-l border-[#262636] bg-surface-base/40 p-4 backdrop-blur-2xl md:max-w-[320px] lg:max-w-[360px]"
        >
          <KaraokeSidebar
            roomCode={roomCode}
            queueCount={queueCount}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onAddSong={handleAddSong}
            playerRef={playerRef}
            playerState={playerState}
            onNext={advanceQueue}
            isHost={isHost}
          />
        </aside>
      </div>
    </div>
  );
}

function GuestWaitingScreen({ roomCode, guestName }: { roomCode: string; guestName: string }) {
  return (
    <div className="stage-bg relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <span className="grid h-20 w-20 place-items-center rounded-full bg-accent/15 shadow-[0_0_40px_var(--color-accent-glow)]">
          <Clock className="h-10 w-10 text-accent" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Waiting for Approval</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-tertiary sm:text-base">
            Hi <span className="font-semibold break-words text-white">{guestName}</span> — the host
            needs to approve your request to join room{" "}
            <span className="font-mono font-bold text-accent">{roomCode}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_8px_var(--color-accent-glow)]" />
          Waiting for host...
        </div>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--radius-xs)] px-4 text-sm text-text-tertiary transition-colors hover:text-status-error focus-visible:outline-2 focus-visible:outline-accent"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Leave Queue
        </Link>
      </motion.div>
    </div>
  );
}

function GuestDeniedScreen() {
  return (
    <div className="stage-bg relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <span className="grid h-20 w-20 place-items-center rounded-full bg-status-error/15">
          <XCircle className="h-10 w-10 text-status-error" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Request Denied</h1>
          <p className="mt-2 text-sm text-text-tertiary sm:text-base">
            The host has declined your request to join this room.
          </p>
        </div>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-xs)] bg-accent px-5 py-2.5 text-sm font-semibold text-surface-base transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}

interface HostHeaderProps {
  roomCode: string;
  participantCount: number;
  isHost: boolean;
  hostName: string;
  onEndSession: () => void;
}

function HostHeader({ roomCode, participantCount, isHost, hostName, onEndSession }: HostHeaderProps) {
  return (
    <header className="glass-strong relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-accent shadow-[0_0_16px_var(--color-accent-glow)]">
          <Mic className="h-4 w-4 text-surface-base" aria-hidden="true" />
        </span>
        <span className="hidden text-sm font-bold tracking-wide min-[400px]:inline sm:text-base">
          Mcpatenz-<span className="text-accent">KaraokeHub</span>
        </span>
        <HostNameChip name={hostName} />
        <RoomPill code={roomCode} />
        <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-text-tertiary sm:inline-flex">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {participantCount}
        </span>
        {!isHost && (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
            Guest
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          onClick={onEndSession}
          className="inline-flex h-9 min-h-[44px] items-center gap-1.5 rounded-[var(--radius-xs)] px-2 sm:px-3 text-sm text-text-tertiary transition-colors hover:bg-status-error/10 hover:text-status-error focus-visible:outline-2 focus-visible:outline-accent"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{isHost ? "End Session" : "Leave"}</span>
        </Link>
        {isHost && <Monitor className="hidden h-4 w-4 text-text-tertiary sm:block" aria-hidden="true" />}
      </div>
    </header>
  );
}

/**
 * Names are capped at 15 characters, but narrow phones still need a hard stop so
 * a long name can never push the room code or the exit button off-screen.
 */
function HostNameChip({ name }: { name: string }) {
  if (!name) return null;
  return (
    <span
      title={`Hosted by ${name}`}
      className="flex min-w-0 max-w-[5.5rem] shrink items-center gap-1 text-[11px] font-medium text-text-tertiary min-[400px]:max-w-[8rem] sm:max-w-[10rem]"
    >
      <span className="hidden shrink-0 text-text-tertiary/70 min-[400px]:inline">by</span>
      <span className="truncate text-white/90">{name}</span>
    </span>
  );
}

function RoomPill({ code }: { code: string }) {
  return (
    <span className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-accent shadow-[0_0_12px_var(--color-accent-glow)] sm:px-3">
      <span className="hidden sm:inline">Room:&nbsp;</span>
      {code}
    </span>
  );
}