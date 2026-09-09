"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, MoreVertical, Play, X, ListMusic } from "lucide-react";
import type { QueueItem } from "@/stores/queueStore";
import { AlbumArt } from "./SongArt";

interface QueueItemRowProps {
  item: QueueItem;
  index: number;
  onPlayNext: (id: string) => void;
  onMoveToTop: (id: string) => void;
  onRemove: (id: string, title: string) => void;
  onView: (item: QueueItem) => void;
}

export default function QueueItemRow({
  item,
  index,
  onPlayNext,
  onMoveToTop,
  onRemove,
  onView,
}: QueueItemRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems: { label: string; onClick: () => void }[] = [
    { label: "Play Next", onClick: () => onPlayNext(item.id) },
    { label: "Move to Top", onClick: () => onMoveToTop(item.id) },
    { label: "View Song", onClick: () => onView(item) },
    {
      label: "Remove",
      onClick: () => onRemove(item.id, item.title),
    },
  ];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
      className="group relative flex items-center gap-2 rounded-[var(--radius-xs)] border border-border-default bg-surface-raised px-2 py-2 hover:border-accent/40"
    >
      <span
        className="cursor-grab shrink-0 text-text-tertiary transition-colors group-hover:text-accent active:cursor-grabbing"
        aria-hidden="true"
      >
        <GripVertical className="h-4 w-4" />
      </span>

      <span className="w-5 shrink-0 text-center font-mono text-xs text-text-tertiary">
        {String(index + 1).padStart(2, "0")}
      </span>

      <AlbumArt song={item} className="h-10 w-10 rounded-[var(--radius-xs)]" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{item.title}</p>
        <p className="truncate text-xs text-text-tertiary">{item.artist}</p>
        <p className="truncate text-[11px] text-text-tertiary/70">
          Added by {item.addedBy}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onPlayNext(item.id)}
          aria-label={`Play ${item.title} next`}
          className="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(item.id, item.title)}
          aria-label={`Remove ${item.title} from queue`}
          className="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-status-error/10 hover:text-status-error focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={`More actions for ${item.title}`}
          aria-expanded={menuOpen}
          className="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-surface-strong hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-2 top-full z-50 mt-1 w-40 overflow-hidden rounded-[var(--radius-xs)] border border-border-default bg-surface-strong p-1 shadow-xl"
            >
              {menuItems.map((mi) => (
                <button
                  key={mi.label}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    mi.onClick();
                  }}
                  className={`block w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-surface-raised ${
                    mi.label === "Remove"
                      ? "text-status-error hover:bg-status-error/10"
                      : "text-text-primary hover:text-accent"
                  }`}
                >
                  {mi.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export function EmptyQueue({ onAddSong }: { onAddSong: () => void }) {
  return (
    <div className="flex flex-col items-center px-2 pb-4 pt-10 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-strong text-text-tertiary">
        <ListMusic className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-4 text-base font-medium text-white">Queue is empty</p>
      <p className="mt-1 text-sm text-text-tertiary">Add some songs to get started</p>
      <button
        type="button"
        onClick={onAddSong}
        className="mt-5 inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-xs)] border border-accent/40 bg-accent/10 px-5 text-sm font-semibold text-accent transition-all hover:bg-accent hover:text-text-inverse focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ListMusic className="h-4 w-4" aria-hidden="true" />
        Add Song
      </button>
    </div>
  );
}
