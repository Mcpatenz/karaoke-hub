"use client";

import { useCallback, useEffect, useRef } from "react";
import { MOCK_LYRICS } from "@/lib/mockData";
import { usePlayerStore } from "@/stores/playerStore";

interface LyricsProps {
  className?: string;
}

export default function Lyrics({ className = "" }: LyricsProps) {
  const { currentTime, state } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const userScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeIndex = MOCK_LYRICS.reduce((acc, line, i) => {
    if (currentTime >= line.time) return i;
    return acc;
  }, -1);

  const handleScroll = useCallback(() => {
    userScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      userScrolling.current = false;
    }, 1500);
  }, []);

  useEffect(() => {
    if (userScrolling.current) return;
    const line = lineRefs.current[activeIndex];
    if (line && containerRef.current) {
      const container = containerRef.current;
      const lineTop = line.offsetTop;
      const target = lineTop - container.clientHeight / 2 + line.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }
  }, [activeIndex]);

  const isActive = state === "playing" || state === "paused" || state === "buffering";

  if (activeIndex < 0 && !isActive) {
    return (
      <div className={className}>
        <div ref={containerRef} className="overflow-y-auto" />
        <p className="text-center text-sm text-text-tertiary">Hit play to start singing</p>
      </div>
    );
  }

  return (
    <section
      aria-label="Song lyrics"
      className={[
        "relative flex min-h-40 items-center overflow-hidden py-4 text-center",
        className,
      ].join(" ")}
    >
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="mx-auto max-h-72 w-full max-w-xl overflow-y-auto px-4 md:py-2"
      >
        {MOCK_LYRICS.map((line, i) => {
          const isCurrent = i === activeIndex && isActive;
          return (
            <p
              key={line.time}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              aria-current={isCurrent ? "true" : undefined}
              className={[
                "transition-all duration-[var(--duration-instant)]",
                isCurrent
                  ? "py-2 text-2xl font-semibold text-text-primary md:text-3xl"
                  : "py-1.5 text-base text-gray-500 md:text-xl",
              ].join(" ")}
            >
              {line.text}
            </p>
          );
        })}
      </div>
    </section>
  );
}