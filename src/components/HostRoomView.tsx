"use client";

import KaraokeHostRoom from "@/components/karaoke/KaraokeHostRoom";
import { ToastProvider } from "@/components/ui/Toast";
import { useRoomStore } from "@/stores/roomStore";

export default function HostRoomView({ roomCode }: { roomCode: string }) {
  const hostName = useRoomStore((s) => s.hostName) || "DJ";
  return (
    <ToastProvider>
      <KaraokeHostRoom roomCode={roomCode} hostName={hostName} />
    </ToastProvider>
  );
}
