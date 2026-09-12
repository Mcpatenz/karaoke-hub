"use client";

import KaraokeHostRoom from "@/components/karaoke/KaraokeHostRoom";
import { ToastProvider } from "@/components/ui/Toast";

export default function HostRoomView({ roomCode }: { roomCode: string }) {
  return (
    <ToastProvider>
      <KaraokeHostRoom roomCode={roomCode} />
    </ToastProvider>
  );
}