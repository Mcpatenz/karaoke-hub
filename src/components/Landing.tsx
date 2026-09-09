"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion, MotionConfig, motion } from "framer-motion";
import { Mic, QrCode, Radio, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useRoomStore } from "@/stores/roomStore";
import QrScanner from "@/components/QrScanner";
import { StageBackground } from "@/components/karaoke/StageBackground";
import WelcomeModal from "@/components/WelcomeModal";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function JoinSection() {
  const reduce = useReducedMotion();
  const transition = reduce ? { duration: 0 } : { duration: 0.6, ease: EASE };
  const {
    hostName,
    guestName,
    roomCode,
    setHostName,
    setGuestName,
    setRoomCode,
  } = useRoomStore();
  const { toast } = useToast();
  const router = useRouter();
  const [scanOpen, setScanOpen] = useState(false);

  const hostRoom = () => {
    if (!hostName.trim()) {
      toast("Enter a DJ name to start the party", "error");
      return;
    }
    const code = (hostName.replace(/\s+/g, "") || "KARAOKE").toUpperCase();
    setRoomCode(code);
    toast("Room created successfully");
    router.push(`/host/${code}`);
  };

  const joinRoom = () => {
    if (!roomCode.trim()) {
      toast("Enter a room code to join", "error");
      return;
    }
    if (!guestName.trim()) {
      toast("Enter your singer name", "error");
      return;
    }
    router.push(`/host/${roomCode.trim().toUpperCase()}`);
  };

  const handleScannedCode = useCallback(
    (code: string) => {
      setRoomCode(code);
      setScanOpen(false);
      toast(`Room code ${code} found`);
      router.push(`/host/${code}`);
    },
    [setRoomCode, toast, router],
  );

  return (
    <section
      id="join"
      aria-label="Host or join a karaoke room"
      className="relative flex min-h-screen items-center overflow-hidden pb-24 pt-10 lg:pb-10"
    >
      <StageBackground vignette particles={20} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 lg:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={transition}
            className="text-[11px] font-semibold uppercase tracking-[0.35em] text-accent"
          >
            Your Night. Your Playlist.
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={transition}
            className="mt-3 text-4xl font-bold tracking-tight md:text-5xl"
          >
            Sing. Play.{" "}
            <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              Together.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.05, ...transition }}
            className="mx-auto mt-4 max-w-md text-sm text-text-tertiary md:text-base"
          >
            Step up to the stage. No account needed — jump in and sing in
            seconds.
          </motion.p>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl gap-4 md:grid-cols-2">
          <motion.form
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
            onSubmit={(e) => {
              e.preventDefault();
              hostRoom();
            }}
            className="glass rounded-(--radius-sm) p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-(--radius-sm) bg-accent/15 text-accent shadow-[0_0_20px_var(--color-accent-glow)]">
                <Radio className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold">Host a Room</h2>
            </div>
            <Input
              label="Your Name"
              placeholder="e.g. Nova"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              icon={Mic}
            />
            <Button type="submit" fullWidth className="mt-4">
              START PARTY
            </Button>
          </motion.form>

          <motion.form
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.08, ...transition }}
            onSubmit={(e) => {
              e.preventDefault();
              joinRoom();
            }}
            className="glass rounded-(--radius-sm) p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-(--radius-sm) bg-accent/15 text-accent shadow-[0_0_20px_var(--color-accent-glow)]">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold">Join the Stage</h2>
            </div>
            <Input
              label="Your Name (Singer)"
              placeholder="e.g. Alex"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              icon={Mic}
            />
            <div className="mt-4">
              <Input
                label="Room Code"
                placeholder="e.g. A7X29"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                icon={Radio}
                autoComplete="off"
                action={
                  <button
                    type="button"
                    onClick={() => setScanOpen(true)}
                    aria-label="Scan QR code"
                    className="grid h-11 w-11 place-items-center rounded-(--radius-xs) text-text-tertiary transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <QrCode className="h-5 w-5" aria-hidden="true" />
                  </button>
                }
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              fullWidth
              className="mt-4"
            >
              JOIN ROOM
            </Button>
          </motion.form>

          <QrScanner
            open={scanOpen}
            onClose={() => setScanOpen(false)}
            onScan={handleScannedCode}
          />
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  return (
    <MotionConfig reducedMotion="user">
      <main>
        <JoinSection />
      </main>
      <WelcomeModal open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </MotionConfig>
  );
}
