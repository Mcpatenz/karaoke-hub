"use client";

import { useState } from "react";
import { Copy, Check, QrCode, Link2 } from "lucide-react";
import Button from "@/components/ui/Button";

const QR_PLACEHOLDER = (() => {
  const cells = [
    0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,
    1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,
    1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,
    1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,
    1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,
    0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,
    1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,
    0,0,0,0,1,1,1,1,0,1,1,1,0,0,0,
    1,1,0,1,1,0,1,0,1,0,1,1,0,1,1,
    0,1,1,1,0,0,1,1,0,1,0,0,1,1,0,
    1,1,0,1,0,0,1,1,0,1,0,0,1,0,1,
    0,1,1,1,1,1,0,0,1,0,1,1,1,1,1,
    1,0,0,0,0,0,1,1,1,1,0,1,0,1,0,
    1,0,0,1,0,0,1,1,0,0,1,0,0,1,1,
    0,1,1,1,1,1,0,0,0,1,1,0,0,0,1,
  ];
  return cells;
})();

interface RoomJoinQRProps {
  roomCode: string;
  className?: string;
}

export default function RoomJoinQR({ roomCode, className = "" }: RoomJoinQRProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(`mcpatenzkaraoke.app/room/${roomCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={["glass rounded-[var(--radius-sm)] p-6", className].join(" ")}>
      <div className="mx-auto mb-4 grid w-44 place-items-center rounded-[var(--radius-xs)] border border-border-default bg-white p-4">
        <svg
          viewBox="0 0 15 15"
          className="h-full w-full"
          role="img"
          aria-label={`QR code for room ${roomCode}`}
        >
          {QR_PLACEHOLDER.map((v, i) =>
            v ? (
              <rect
                key={i}
                x={i % 15}
                y={Math.floor(i / 15)}
                width="1"
                height="1"
                fill="#09090b"
              />
            ) : null,
          )}
        </svg>
      </div>
      <p className="text-center text-xs font-medium uppercase tracking-widest text-text-tertiary">
        Scan to join
      </p>
      <div className="mt-2 mb-4 flex items-center justify-center gap-2">
        <QrCode className="h-4 w-4 text-accent" aria-hidden="true" />
        <code className="font-mono text-lg font-bold tracking-widest text-text-primary">
          ROOM: {roomCode}
        </code>
      </div>
      <Button
        variant="secondary"
        fullWidth
        onClick={copyCode}
        className={`transition-all duration-[var(--duration-instant)] ${
          copied ? "text-status-success" : ""
        }`}
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        {copied ? "Copied!" : "Copy Room Code"}
      </Button>
      <p className="mt-4 text-center text-xs text-text-tertiary">
        <Link2 className="mr-1 inline h-3 w-3" aria-hidden="true" />
        Or enter the room code manually.
      </p>
    </div>
  );
}