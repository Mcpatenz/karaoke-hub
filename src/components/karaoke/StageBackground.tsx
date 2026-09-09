"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

type GlowColor = "purple" | "blue" | "magenta" | "cyan";

interface StageBackgroundProps {
  /** Enable the cinematic vignette that darkens edges */
  vignette?: boolean;
  /** Number of floating light particles (0 to disable) */
  particles?: number;
  /** Classes to apply to the root layer */
  className?: string;
}

const GLOW_HEX: Record<GlowColor, string> = {
  purple: "rgba(168, 85, 247, 0.9)",
  blue: "rgba(96, 165, 250, 0.9)",
  magenta: "rgba(236, 72, 153, 0.9)",
  cyan: "rgba(34, 211, 238, 0.9)",
};

/**
 * Reusable premium nightlife ambience: layered radial glows, drifting haze
 * blobs, and floating light particles. Rendered absolutely behind content.
 */
export function StageBackground({
  vignette = false,
  particles = 18,
  className = "",
}: StageBackgroundProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const haze = useMemo(
    () => [
      { color: "purple" as const, size: 420, top: -80, left: -60 },
      { color: "blue" as const, size: 380, top: 20, right: -90 },
      { color: "magenta" as const, size: 360, bottom: -70, left: "35%" },
    ],
    [],
  );

  const dots = useMemo(() => {
    if (reduce || particles <= 0) return [];
    let seed = 123456789;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    return Array.from({ length: particles }, (_, i) => ({
      id: i,
      left: `${(rand() * 100).toFixed(2)}%`,
      size: 2 + rand() * 4,
      duration: 9 + rand() * 14,
      delay: rand() * 12,
    }));
  }, [particles, reduce, mounted]);

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="stage-bg absolute inset-0" />

      {/* Drifting haze blobs */}
      {haze.map((b, i) => (
        <span
          key={i}
          className="stage-haze"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            background: GLOW_HEX[b.color],
            animationDelay: `${i * -4}s`,
          }}
        />
      ))}

      {/* Floating light particles (client-only to avoid hydration mismatch) */}
      {mounted ? (
        dots.map((d) => (
          <span
            key={d.id}
            className="stage-particle"
            style={{
              left: d.left,
              bottom: "-10px",
              width: d.size,
              height: d.size,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))
      ) : null}

      {vignette ? <div className="stage-vignette absolute inset-0" /> : null}
    </div>
  );
}
