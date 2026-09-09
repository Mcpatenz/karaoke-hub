"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CameraOff, QrCode } from "lucide-react";
import jsQR from "jsqr";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";

interface QrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function QrScanner({ open, onClose, onScan }: QrScannerProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Scan QR code">
      <ScannerContent onClose={onClose} onScan={onScan} />
    </Dialog>
  );
}

function extractRoomCode(text: string): string | null {
  const urlMatch = text.match(/\/join\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[A-Za-z0-9]{4,8}$/.test(text.trim())) return text.trim();
  return null;
}

function ScannerContent({ onClose, onScan }: Omit<QrScannerProps, "open">) {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  const [cameraState, setCameraState] = useState<"starting" | "live" | "unavailable">(
    "starting",
  );

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    let cancelled = false;
    const stopCamera = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(scanFrame);
        return;
      }
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code?.data) {
        const roomCode = extractRoomCode(code.data);
        if (roomCode) {
          onScanRef.current(roomCode);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(scanFrame);
    };

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraState("live");
        rafRef.current = requestAnimationFrame(scanFrame);
      } catch {
        if (!cancelled) setCameraState("unavailable");
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  const scanLine = reduce ? (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-1/2 h-px bg-accent shadow-[0_0_8px_var(--color-accent-glow)]"
    />
  ) : (
    <motion.div
      aria-hidden="true"
      className="absolute inset-x-0 h-px bg-accent shadow-[0_0_8px_var(--color-accent-glow)]"
      initial={{ top: "10%" }}
      animate={{ top: ["10%", "90%"] }}
      transition={{ duration: 1.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
    />
  );

  return (
    <div className="p-6">
      <p className="mb-4 text-sm text-text-tertiary">
        Point your camera at the room&apos;s QR code to join instantly.
      </p>

      <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-[var(--radius-sm)] border border-border-default bg-black">
        <canvas ref={canvasRef} className="hidden" />
        {cameraState === "live" && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
        <div className="pointer-events-none absolute inset-4 rounded-[var(--radius-xs)] border border-white/20" />
        {cameraState !== "live" && (
          <div className="absolute inset-0 grid place-items-center">
            {cameraState === "unavailable" ? (
              <div className="flex flex-col items-center gap-2 px-6 text-center">
                <CameraOff className="h-8 w-8 text-text-tertiary" aria-hidden="true" />
                <p className="text-sm text-text-tertiary">
                  Camera unavailable or permission denied.
                </p>
              </div>
            ) : (
              <QrCode
                className="h-10 w-10 animate-pulse-glow text-text-tertiary"
                aria-hidden="true"
              />
            )}
          </div>
        )}
        {cameraState === "live" && scanLine}
      </div>

      <p className="mt-4 text-center text-xs text-text-tertiary">
        {cameraState === "live"
          ? "Scanning…"
          : cameraState === "unavailable"
            ? "You can still join by entering the code manually."
            : "Starting camera…"}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onClose}
          disabled={cameraState === "starting"}
        >
          Enter Code Manually
        </Button>
      </div>
    </div>
  );
}
