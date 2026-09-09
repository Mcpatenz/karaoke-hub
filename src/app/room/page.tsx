"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";
import { NowPlayingStage } from "@/components/karaoke/NowPlayingStage";
import Lyrics from "@/components/karaoke/Lyrics";
import Queue from "@/components/karaoke/Queue";
import SongSearch from "@/components/karaoke/SongSearch";
import GuestList from "@/components/karaoke/GuestList";
import RoomJoinQR from "@/components/karaoke/RoomJoinQR";
import SongList from "@/components/karaoke/SongList";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { useRoomStore } from "@/stores/roomStore";
import { useQueueStore } from "@/stores/queueStore";
import type { QueueItem } from "@/stores/queueStore";
import type { Song } from "@/stores/searchStore";
import { songProvider } from "@/lib/songProvider";

const ROOM_CODE = "A7X29";

const MOCK_GUESTS = [
  { id: "g1", name: "DJ Nova", isHost: true },
  { id: "g2", name: "Alex" },
  { id: "g3", name: "Sam" },
  { id: "g4", name: "Riley" },
  { id: "g5", name: "Taylor" },
  { id: "g6", name: "Jordan" },
  { id: "g7", name: "Casey" },
  { id: "g8", name: "Morgan" },
];

let queueCounter = 1;

function RoomContent() {
  const { isLocked, setLocked } = useRoomStore();
  const addToQueue = useQueueStore((s) => s.addToQueue);
  const completeCurrent = useQueueStore((s) => s.completeCurrent);
  const nowPlaying = useQueueStore((s) => s.nowPlaying);
  const { toast } = useToast();
  const [joined, setJoined] = useState(true);
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    songProvider
      .getTopPlayed(1)
      .then((songs) => {
        const first = songs[0];
        if (!first) return;
        const item: QueueItem = {
          id: `q-${queueCounter++}`,
          songId: first.id,
          title: first.title,
          artist: first.artist,
          album: first.album,
          artwork: first.artwork,
          duration: first.duration,
          videoId: first.videoId,
          channel: first.channel,
          addedBy: "DJ Nova",
        };
        addToQueue(item);
      })
      .catch(() => {
        addToQueue({
          id: `q-${queueCounter++}`,
          songId: "np",
          title: "Perfect",
          artist: "Ed Sheeran",
          addedBy: "DJ Nova",
        });
      });
  }, [addToQueue]);

  const handleAddSong = (song: Song | { title: string; artist: string }) => {
    const isFull = "id" in song;
    const item: QueueItem = {
      id: `q-${queueCounter++}`,
      songId: isFull ? song.id : String(Math.random()),
      title: song.title,
      artist: song.artist,
      album: isFull ? song.album : undefined,
      artwork: isFull ? song.artwork : undefined,
      duration: isFull ? song.duration : undefined,
      videoId: isFull ? song.videoId : undefined,
      channel: isFull ? song.channel : undefined,
      addedBy: "DJ Nova",
    };
    addToQueue(item);
  };

  const toggleLock = () => {
    const next = !isLocked;
    setLocked(next);
    toast(next ? "Room locked" : "Room unlocked");
  };

  return (
    <div className="stage-bg relative min-h-screen pb-24 lg:pb-10"><main className="relative z-10 mx-auto max-w-7xl px-4 pt-10 lg:px-6">
        {/* Room status bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="flex items-center gap-3 text-lg font-semibold">
            {ROOM_CODE}
            <Badge variant="live">LIVE</Badge>
          </h1>
          <Badge variant="default">{MOCK_GUESTS.length} Guests</Badge>
          <button
            onClick={toggleLock}
            aria-label={isLocked ? "Unlock room" : "Lock room"}
            aria-pressed={isLocked}
            className="flex min-h-[44px] items-center gap-2 rounded-[var(--radius-xs)] px-2 text-sm text-text-tertiary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
          >
            {isLocked ? (
              <Lock className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Unlock className="h-4 w-4" aria-hidden="true" />
            )}
            {isLocked ? "Locked" : "Open"}
          </button>
          {joined ? (
            <Badge variant="success">Joined</Badge>
          ) : (
            <Button size="sm" onClick={() => { setJoined(true); toast("Room joined"); }}>
              Join Room
            </Button>
          )}
        </div>

        {/* Player + Queue / Guests */}
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-4">
            {nowPlaying ? (
              <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-sm)] border border-border-default">
                <NowPlayingStage song={nowPlaying} onEnded={completeCurrent} />
              </div>
            ) : (
              <div className="grid aspect-video w-full place-items-center rounded-[var(--radius-sm)] border border-border-default bg-surface-strong/40 text-sm text-text-tertiary">
                Queuing your first karaoke video…
              </div>
            )}
            <Lyrics />
            <SongSearch
              onAddSong={handleAddSong}
              className="lg:hidden"
            />
          </div>

          <aside className="space-y-4">
            <Queue isHost />
            <GuestList guests={MOCK_GUESTS} isHost currentGuestName="DJ Nova" />
            <RoomJoinQR roomCode={ROOM_CODE} />
          </aside>
        </div>

        {/* Discovery */}
        <section className="mt-8">
          <div className="hidden lg:block">
            <SongSearch onAddSong={handleAddSong} />
          </div>
          <div className="mt-6">
            <SongList onAddToQueue={handleAddSong} title="Popular Tonight" />
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}

export default function RoomPage() {
  return (
    <ToastProvider>
      <RoomContent />
    </ToastProvider>
  );
}