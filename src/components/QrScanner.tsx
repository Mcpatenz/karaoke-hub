"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CameraOff, QrCode, RefreshCw, Zap, ZapOff } from "lucide-react";
import jsQR from "jsqr";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";

interface QrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

type CameraState = "starting" | "live" | "denied" | "not-found" | "unavailable";

/** Keep jsQR fast on phones: detect against a downscaled frame. */
const SCAN_MAX_DIM = 480;

interface TorchCapabilities {
  torch?: boolean;
}

export default function QrScanner({ open, onClose, onScan }: QrScannerProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Scan QR code">
      <ScannerContent onClose={onClose} onScan={onScan} />
    </Dialog>
  );
}

function extractRoomCode(text: string): string | null {
  const urlMatch = text.match(/\/(?:join|host)\/([A-Za-z0-9]+)/);
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
  const [cameraState, setCameraState] = useState<CameraState>("starting");
  const [retryCount, setRetryCount] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    if (cameraState !== "live") return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {});
  }, [cameraState]);

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

    const scanFrame = function scanFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(scanFrame);
        return;
      }
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        rafRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      // Downscale so jsQR stays fast on phones.
      const vw = video.videoWidth || 1;
      const vh = video.videoHeight || 1;
      const scale = Math.min(1, SCAN_MAX_DIM / Math.max(vw, vh));
      canvas.width = Math.max(2, Math.round(vw * scale));
      canvas.height = Math.max(2, Math.round(vh * scale));
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
      if (cancelled) return;
      setCameraState("starting");
      stopCamera();
      setTorchOn(false);
      setTorchSupported(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        return;
      }

      const attempts: MediaStreamConstraints[] = [
        // Preferred: rear camera at a sane resolution.
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        // Some devices need the exact (non-ideal) facing constraint.
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        // Last resort: any available camera.
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;
      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!stream) {
        setCameraState(classifyError(lastError));
        return;
      }

      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      setTorchSupported(Boolean((track?.getCapabilities?.() as TorchCapabilities | undefined)?.torch));
      setCameraState("live");
      rafRef.current = requestAnimationFrame(scanFrame);
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [retryCount]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn((v) => !v);
    } catch {
      /* torch unsupported on this device/browser */
    }
  };

  const scanLine = reduce ? (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-1/2 h-px bg-accent shadow-[0_0_8px_var(--color-accent-glow)]"
    />
  ) : (
    <motion.div
      aria-hidden="true"
      className="absolute inset-x-0 h-px bg-accent shadow-[0_0_8px_var(--color-accent-glow)]"
      initial={{ top: "15%" }}
      animate={{ top: ["15%", "85%"] }}
      transition={{ duration: 1.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
    />
  );

  return (
    <div className="flex flex-col">
      <p className="px-6 pb-4 pt-6 text-sm text-text-tertiary">
        Point your camera at the room&apos;s QR code to join instantly.
      </p>

      {/* Camera preview: full-bleed on phones, framed card on desktop */}
      <div
        className="relative w-full overflow-hidden bg-black sm:mx-auto sm:aspect-square sm:max-w-[420px] sm:rounded-[var(--radius-sm)] sm:border sm:border-border-default"
        style={{ minHeight: "min(55dvh, 460px)" }}
      >
        <canvas ref={canvasRef} className="hidden" />
        {cameraState === "live" && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="pointer-events-none absolute inset-4 rounded-[var(--radius-xs)] border border-white/20" />
        {cameraState === "live" && scanLine}

        {cameraState !== "live" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/80">
            <div className="flex flex-col items-center gap-3 px-8 text-center">
              {cameraState === "starting" ? (
                <QrCode
                  className="h-10 w-10 animate-pulse-glow text-text-tertiary"
                  aria-hidden="true"
                />
              ) : (
                <CameraOff className="h-8 w-8 text-text-tertiary" aria-hidden="true" />
              )}
              <p className="text-sm text-text-tertiary">{statusMessage(cameraState)}</p>
              {cameraState !== "starting" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRetryCount((c) => c + 1)}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}

        {torchSupported && cameraState === "live" && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label={torchOn ? "Turn flash off" : "Turn flash on"}
            aria-pressed={torchOn}
            className="absolute bottom-4 right-4 z-20 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            {torchOn ? (
              <ZapOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Zap className="h-5 w-5 fill-current" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <p className="px-6 pb-4 pt-4 text-center text-xs text-text-tertiary">
        {statusHint(cameraState)}
      </p>

      <div className="flex items-center justify-center gap-3 px-6 pb-6">
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

function classifyError(err: unknown): CameraState {
  if (!err) return "unavailable";
  const name = (err as DOMException)?.name;
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    return "denied";
  }
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    name === "OverconstrainedError"
  ) {
    return "not-found";
  }
  return "unavailable";
}

function statusMessage(state: CameraState): string {
  switch (state) {
    case "starting":
      return "Starting camera…";
    case "denied":
      return "Camera permission is off.";
    case "not-found":
      return "No camera found on this device.";
    case "unavailable":
      return "Camera is unavailable.";
    default:
      return "";
  }
}

function statusHint(state: CameraState): string {
  switch (state) {
    case "live":
      return "Scanning…";
    case "denied":
      return "Allow camera access in your browser settings, then tap Try Again.";
    case "unavailable":
      return "Camera unavailable or in use by another app.";
    case "not-found":
      return "No camera was found on this device.";
    default:
      return "Starting camera…";
  }
}