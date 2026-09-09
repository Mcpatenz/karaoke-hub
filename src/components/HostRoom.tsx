"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import Link from "next/link";
import {
  ListMusic,
  Lock,
  Mic,
  Monitor,
  QrCode,
  Settings,
  Smartphone,
  Unlock,
  Users,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import KaraokePlayer from "@/components/karaoke/KaraokePlayer";
import Lyrics from "@/components/karaoke/Lyrics";
import Queue from "@/components/karaoke/Queue";
import SongSearch from "@/components/karaoke/SongSearch";
import GuestList from "@/components/karaoke/GuestList";
import SongList from "@/components/karaoke/SongList";
import RoomJoinQR from "@/components/karaoke/RoomJoinQR";
import { useRoomStore } from "@/stores/roomStore";
import { useQueueStore } from "@/stores/queueStore";
import type { QueueItem } from "@/stores/queueStore";
import type { Song } from "@/stores/searchStore";
import { usePlayerStore } from "@/stores/playerStore";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const LANDSCAPE_BENEFITS = [
  "Larger video player",
  "Easier queue management",
  "Better control layout",
  "Improved visibility",
];

const HDR_BTN =
  "inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-xs)] border border-border-default bg-surface-raised px-3 text-sm font-medium text-text-primary transition-colors hover:border-accent/40 hover:bg-surface-strong hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent";

interface HostRoomProps {
  roomCode: string;
  hostName: string;
}

interface HostSettings {
  preventDuplicates: boolean;
  guestQueueLimit: number;
  autoplayNext: boolean;
  showLyrics: boolean;
}

const DEFAULT_SETTINGS: HostSettings = {
  preventDuplicates: true,
  guestQueueLimit: 5,
  autoplayNext: true,
  showLyrics: true,
};

export default function HostRoom({ roomCode, hostName }: HostRoomProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [qrOpen, setQrOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<HostSettings>(DEFAULT_SETTINGS);

  const room = useRoomStore();
  const queue = useQueueStore();
  const player = usePlayerStore();

  const songIdRef = useRef(1);
  const seeded = useRef(false);

  const handleToggleSetting = (key: keyof HostSettings, value: number | boolean) => {
    setSettings((s) => ({ ...s, [key]: value }));
    toast("Settings updated");
  };

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const mocks = [
      { id: "g-seed-1", name: "Ava", isHost: false },
      { id: "g-seed-2", name: "Leo", isHost: false },
      { id: "g-seed-3", name: "Mia", isHost: false },
    ];
    mocks.forEach((g) => room.addGuest(g));
  }, [room]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (step < 2) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [step]);

  const roomGuests = [{ id: "host", name: hostName, isHost: true }, ...room.guests];

  const handleAddSong = (song: Song, addedBy = hostName): boolean => {
    const normalized = song.title.trim().toLowerCase();
    const inQueue = [queue.nowPlaying, ...queue.upcoming]
      .filter((i) => i !== null)
      .some((i) => i.title.toLowerCase() === normalized);

    if (settings.preventDuplicates && inQueue) {
      toast(`"${song.title}" is already in the queue`, "error");
      return false;
    }

    if (addedBy !== hostName && settings.guestQueueLimit > 0) {
      const count =
        (queue.nowPlaying?.addedBy === addedBy ? 1 : 0) +
        queue.upcoming.filter((i) => i.addedBy === addedBy).length;
      if (count >= settings.guestQueueLimit) {
        toast(`${addedBy} can queue up to ${settings.guestQueueLimit} songs at once`, "error");
        return false;
      }
    }

    const item: QueueItem = {
      id: `q-${songIdRef.current++}`,
      songId: song.id,
      title: song.title.trim(),
      artist: song.artist,
      album: song.album,
      artwork: song.artwork,
      duration: song.duration,
      videoId: song.videoId,
      channel: song.channel,
      addedBy,
    };

    queue.addToQueue(item);

    if (!queue.nowPlaying && settings.autoplayNext) {
      queue.playNext(item.id);
      toast(`Now playing: ${item.title}`);
    }

    return true;
  };

  const toggleLock = () => {
    room.setLocked(!room.isLocked);
    toast(room.isLocked ? "Room unlocked" : "Room locked — no new guests can join");
  };

  const handleRemoveGuest = (id: string) => {
    const guest = room.guests.find((g) => g.id === id);
    room.removeGuest(id);
    if (guest) toast(`${guest.name} removed from room`);
  };

  

  return (
    <MotionConfig reducedMotion="user">
      <div className="stage-bg relative min-h-screen">
        <header className="sticky top-0 z-40 glass border-b border-white/[0.06]">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] bg-accent">
                <Mic className="h-4 w-4 text-text-inverse" aria-hidden="true" />
              </span>
              <span className="text-base font-bold">
                Mcpatenz Karaoke<span className="text-accent">Hub</span>
              </span>
              <Badge variant="live">LIVE</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-[44px] items-center rounded-[var(--radius-xs)] border border-accent/40 bg-accent/10 px-3 font-mono text-sm font-bold tracking-[0.2em] text-accent">
                ROOM {roomCode}
              </span>
              <span className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--radius-xs)] border border-border-default bg-surface-raised px-3 text-sm font-medium text-text-primary">
                <Users className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
                {room.guests.length}
              </span>

              <button className={HDR_BTN} onClick={() => setQrOpen(true)}>
                <QrCode className="h-4 w-4" aria-hidden="true" />
                QR
              </button>
              <button
                className={HDR_BTN}
                onClick={toggleLock}
                aria-pressed={room.isLocked}
                aria-label={room.isLocked ? "Unlock room" : "Lock room"}
              >
                {room.isLocked ? (
                  <Lock className="h-4 w-4 text-accent" aria-hidden="true" />
                ) : (
                  <Unlock className="h-4 w-4 text-accent" aria-hidden="true" />
                )}
                {room.isLocked ? "Locked" : "Lock"}
              </button>
              <button className={HDR_BTN} onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4 text-accent" aria-hidden="true" />
                Settings
              </button>
              <Link
                href="/"
                className={`${HDR_BTN} border-status-error/30 text-status-error hover:border-status-error/50 hover:bg-status-error/10`}
              >
                Leave
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-6 lg:grid-cols-[1fr_360px] lg:py-8">
          <section aria-label="Stage" className="min-w-0">
            <div className="relative min-h-[420px] overflow-hidden rounded-[var(--radius-sm)] border border-border-default bg-black">
              <div
                className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full transition-opacity duration-300"
                style={{
                  backgroundImage:
                    "radial-gradient(closest-side, var(--color-accent-glow), transparent)",
                  opacity: queue.nowPlaying ? 0.35 : 0.7,
                }}
                aria-hidden="true"
              />
              <div className="relative">
                <AnimatePresence mode="wait">
                  {queue.nowPlaying ? (
                    <motion.div
                      key="player"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      <KaraokePlayer
                        songTitle={queue.nowPlaying.title}
                        songArtist={queue.nowPlaying.artist}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="wait"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      <WaitStage
                        roomCode={roomCode}
                        hostName={hostName}
                        guestCount={room.guests.length}
                        queuedCount={queue.upcoming.length}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {settings.showLyrics && <Lyrics className="mt-6" />}
          </section>

          <aside className="flex min-w-0 flex-col gap-8">
            <Queue isHost />
            <GuestList
              guests={roomGuests}
              currentGuestName={hostName}
              isHost
              onRemove={handleRemoveGuest}
            />
          </aside>
        </main>

        <div className="mx-auto w-full max-w-[1440px] px-4 pb-16">
          <div className="glass rounded-[var(--radius-sm)] p-4 sm:p-6">
            <SongSearch onAddSong={handleAddSong} addedBy={hostName} />
          </div>
          <SongList title="Popular Tonight" onAddToQueue={handleAddSong} addedBy={hostName} className="mt-8" />
        </div>
      </div>

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} title="Join Room">
        <div className="p-6">
          <div id="host-room-qr" className="flex justify-center rounded-[var(--radius-xs)] bg-surface-base/50 p-4">
            <RoomJoinQR roomCode={roomCode} />
          </div>
          <p className="mt-4 text-center text-sm text-text-tertiary">
            Scan the code or open{" "}
            <span className="font-mono text-accent">mcpatenzkaraoke.app/room/{roomCode}</span> to
            queue songs from your phone.
          </p>
        </div>
      </Dialog>

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Host Settings"
        showClose
      >
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto p-6">
          <section aria-label="Room settings">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Room</h3>
            <ToggleRow
              label="Prevent duplicate songs"
              description="Block songs that are already in the queue"
              checked={settings.preventDuplicates}
              onChange={(v) => handleToggleSetting("preventDuplicates", v)}
            />
            <div className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-medium text-text-primary">Guest queue limit</p>
                <p className="mt-0.5 text-xs text-text-tertiary">Max songs per guest at once</p>
              </div>
              <select
                aria-label="Guest queue limit"
                value={settings.guestQueueLimit}
                onChange={(e) => handleToggleSetting("guestQueueLimit", Number(e.target.value))}
                className="h-11 rounded-[var(--radius-xs)] border border-border-default bg-surface-raised px-3 text-sm font-medium text-text-primary transition-colors hover:border-gray-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {[1, 2, 3, 5, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "song" : "songs"}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section aria-label="Playback settings" className="mt-4 border-t border-border-default pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">
              Playback
            </h3>
            <ToggleRow
              label="Auto-play next song"
              description="Start the queue so the party never stops"
              checked={settings.autoplayNext}
              onChange={(v) => handleToggleSetting("autoplayNext", v)}
            />
            <div className="py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-medium text-text-primary">Volume</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {player.isMuted || player.volume === 0 ? "Muted" : `${Math.round(player.volume * 100)}%`}
                  </p>
                </div>
                <span className="flex items-center gap-2">
                  <button
                    onClick={player.toggleMute}
                    aria-label={player.isMuted ? "Unmute" : "Mute"}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-xs)] border border-border-default text-text-tertiary transition-colors hover:bg-surface-strong hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <span aria-hidden="true" className="text-sm">
                      {player.isMuted ? "Muted" : "On"}
                    </span>
                  </button>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={player.volume}
                onChange={(e) => player.setVolume(Number(e.target.value))}
                aria-label="Player volume"
                className="mt-2 h-2 w-full cursor-pointer accent-accent"
              />
            </div>
          </section>

          <section aria-label="Display settings" className="mt-4 border-t border-border-default pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Display</h3>
            <ToggleRow
              label="Show synchronized lyrics"
              description="Display lyrics under the player"
              checked={settings.showLyrics}
              onChange={(v) => handleToggleSetting("showLyrics", v)}
            />
          </section>

          <p className="mt-6 border-t border-border-default pt-4 text-xs text-text-tertiary">
            Playback shortcuts: <span className="font-mono text-text-primary">Space</span> play/pause ·{" "}
            <span className="font-mono text-text-primary">M</span> mute ·{" "}
            <span className="font-mono text-text-primary">F</span> fullscreen ·{" "}
            <span className="font-mono text-text-primary">←/→</span> seek
          </p>
        </div>
      </Dialog>

      {step === 0 && (
        <OnboardingModal title="Landscape Mode" subtitle="Recommended for Mobile">
          <p className="text-sm text-text-tertiary">
            For the best KaraokeHub experience on mobile, Landscape mode is strongly recommended.
          </p>
          <ul className="mt-4 space-y-2">
            {LANDSCAPE_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm text-text-primary">
                <Smartphone className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                {benefit}
              </li>
            ))}
          </ul>
          <Button fullWidth className="mt-6" onClick={() => setStep(1)}>
            Continue
          </Button>
        </OnboardingModal>
      )}

      {step === 1 && (
        <OnboardingModal title="Your device is TV?">
          <p className="text-sm text-text-tertiary">
            If this screen is a TV, click TV Support to enable remote-friendly navigation. If
            you&apos;re on a computer or phone, just close this.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" fullWidth onClick={() => setStep(2)}>
              Close
            </Button>
            <Button fullWidth onClick={() => setStep(2)}>
              <Monitor className="h-4 w-4" aria-hidden="true" />
              TV Support
            </Button>
          </div>
        </OnboardingModal>
      )}
    </MotionConfig>
  );
}

function WaitStage({
  roomCode,
  hostName,
  guestCount,
  queuedCount,
}: {
  roomCode: string;
  hostName: string;
  guestCount: number;
  queuedCount: number;
}) {
  return (
    <section aria-label="Waiting for songs" className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
      <div className="flex flex-col justify-center text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
          Your room is live · hosted by {hostName}
        </p>
        <h1 className="mt-3 font-mono text-4xl font-bold tracking-[0.2em] text-text-primary sm:text-5xl">
          {roomCode}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          <Badge variant="live">
            <span aria-hidden="true">●</span> LIVE
          </Badge>
          <span className="text-sm text-text-tertiary">
            {guestCount} {guestCount === 1 ? "guest" : "guests"}
          </span>
          <span className="text-sm text-text-tertiary">
            · {queuedCount} {queuedCount === 1 ? "song" : "songs"} queued
          </span>
        </div>
        <div className="mt-2 flex flex-col items-center gap-2 lg:items-start">
          <ReadinessGauge value={80} />
          <p className="flex items-center gap-2 text-sm text-text-tertiary">
            <ListMusic className="h-4 w-4 shrink-0" aria-hidden="true" />
            Waiting for Songs... Add a track below to start singing.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center lg:justify-end">
        <RoomJoinQR roomCode={roomCode} className="h-full" />
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 pr-2">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        style={{ backgroundColor: checked ? "var(--color-accent)" : "var(--color-surface-strong)" }}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-text-inverse shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function OnboardingModal({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="relative w-full max-w-sm rounded-[var(--radius-sm)] border border-border-default bg-surface-muted p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-accent">
            {subtitle}
          </p>
        )}
        <div className="mt-4">{children}</div>
      </motion.div>
    </div>
  );
}

function ReadinessGauge({ value = 80 }: { value?: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);

  return (
    <div
      className="mt-6 flex flex-col items-center gap-2"
      role="img"
      aria-label={`${value}% party readiness`}
    >
      <div className="relative grid h-24 w-24 place-items-center">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-surface-strong)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute text-lg font-bold text-text-primary">{value}%</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
        Party readiness
      </p>
    </div>
  );
}