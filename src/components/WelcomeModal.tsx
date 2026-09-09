"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Music2, Users, Radio, Sparkles, Check } from "lucide-react";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";

const FEATURES = [
  { icon: Music2, label: "100k+ songs" },
  { icon: Users, label: "Live rooms" },
  { icon: Radio, label: "Real-time queue" },
  { icon: Sparkles, label: "Host controls" },
  { icon: Mic, label: "Synchronized lyrics" },
  { icon: Check, label: "No account needed" },
];

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "mcpatenz-hub-welcome-dismissed";

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      /* ignore storage errors */
    }
    setDismissed(stored);
  }, []);

  useEffect(() => {
    if (open && !dismissed) {
      setTimeout(() => continueRef.current?.focus(), 100);
    }
  }, [open, dismissed]);

  const handleContinue = useCallback(() => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* ignore storage errors */
      }
    }
    onClose();
  }, [dontShowAgain, onClose]);

  if (dismissed) return null;

  return (
    <Dialog open={open} onClose={onClose} aria-label="Welcome to Mcpatenz Karaoke Hub">
      <div className="flex max-h-[calc(100vh-32px)] flex-col">
        <div className="text-center pt-8 px-6">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[var(--radius-sm)] bg-accent shadow-[0_0_28px_var(--color-accent-glow)]">
            <Mic className="h-8 w-8 text-text-inverse" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome to Mcpatenz Karaoke<span className="text-accent">Hub</span>
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-tertiary">
            Your premium dark karaoke room. Host a session, invite friends, and own the mic.
          </p>
        </div>

        <div className="mt-6 border-t border-border-default px-6 py-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-tertiary">
            <Radio className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Features
          </p>
          <ul className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[180px] pr-1">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-text-tertiary">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-xs)] bg-surface-raised text-accent">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border-default px-6 py-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-tertiary">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Support the Developer
          </p>
          <p className="flex items-center gap-2 text-sm text-text-tertiary">
            <Users className="h-4 w-4 text-accent" aria-hidden="true" />
            Developed by{" "}
            <span className="font-semibold text-text-primary">Jonel B. Pateño</span>
          </p>
          <p className="mt-2 text-xs text-text-tertiary">
            If you enjoy using KaraokeHub, donations are appreciated!
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-[var(--radius-xs)] border border-accent/30 bg-accent/10 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <span className="text-base">💙</span>
              GCash
            </span>
            <span className="font-mono text-base font-bold tracking-widest text-accent">
              09708701388
            </span>
          </div>
        </div>

        <div className="mt-auto border-t border-border-default bg-surface-muted px-6 py-5">
          <Button
            ref={continueRef}
            size="lg"
            fullWidth
            onClick={handleContinue}
            className="mb-4"
          >
            Continue
          </Button>
          <label className="flex cursor-pointer items-center justify-center gap-2 text-sm text-text-tertiary">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Don't show this again
          </label>
        </div>
      </div>
    </Dialog>
  );
}
