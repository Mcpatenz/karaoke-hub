"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Users } from "lucide-react";
import RoomQRCode from "@/components/karaoke/RoomQRCode";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const JOIN_URL = (code: string) =>
  typeof window !== "undefined"
    ? `${window.location.origin}/join/${code}`
    : `https://mcpatenzkaraoke.app/join/${code}`;

interface WaitingScreenProps {
  roomCode: string;
  guestCount: number;
  onEndSession?: () => void;
}

export default function WaitingScreen({ roomCode, guestCount }: WaitingScreenProps) {
  return (
    <div className="relative flex min-h-full items-center justify-center">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundImage: "radial-gradient(closest-side, var(--color-accent-glow), transparent)", opacity: 0.35 }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="relative flex flex-col items-center px-6 text-center"
      >
        <PlayButton />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
          className="mt-8"
        >
          <div className="rounded-[var(--radius-sm)] border border-white/15 bg-white p-3 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <RoomQRCode
              value={JOIN_URL(roomCode)}
              size={170}
              alt={`QR code to join room ${roomCode}`}
            />
          </div>
        </motion.div>

        <h1 className="mt-8 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
          Waiting for Songs
          <AnimDots />
        </h1>

        <p className="mt-3 text-sm text-text-tertiary sm:text-base">
          Scan the QR code or enter room code
        </p>

        <div className="pointer-events-none mt-6 flex items-center gap-3">
          <span className="font-mono text-3xl font-bold tracking-[0.2em] text-accent sm:text-4xl">
            {roomCode}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-text-tertiary">
            <Users className="h-4 w-4" aria-hidden="true" />
            {guestCount}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function PlayButton() {
  return (
    <motion.button
      type="button"
      aria-label="Start playback"
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
      className="relative grid h-24 w-24 place-items-center rounded-full border-2 border-accent bg-accent/15 text-accent shadow-[0_0_50px_var(--color-accent-glow)] transition-colors hover:bg-accent/25"
    >
      <Play className="h-9 w-9 translate-x-0.5 fill-current" aria-hidden="true" />
    </motion.button>
  );
}

function AnimDots() {
  const [dots, setDots] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return <span className="text-accent">{".".repeat(dots)}</span>;
}

export { AnimDots };
