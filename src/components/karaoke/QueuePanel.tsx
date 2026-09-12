"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useQueueStore, type QueueItem } from "@/stores/queueStore";
import { useRoomStore } from "@/stores/roomStore";
import { roomApi } from "@/lib/roomApi";
import { useToast } from "@/components/ui/Toast";
import QueueItemRow, { EmptyQueue } from "./QueueItemRow";

interface QueuePanelProps {
  roomCode: string;
  onAddSong: () => void;
  onViewSong: (item: QueueItem) => void;
  isHost: boolean;
}

export default function QueuePanel({ roomCode, onAddSong, onViewSong, isHost }: QueuePanelProps) {
  const { upcoming } = useQueueStore();
  const { toast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  const control = (control: string, payload: { id?: string; toIndex?: number } = {}) => {
    const st = useRoomStore.getState();
    if (!st.hostToken || !isHost) return;
    void roomApi.queueControl(roomCode, st.hostToken, control, payload);
  };

  const handleRemove = (id: string, title: string) => {
    control("remove", { id });
    toast(`${title} removed from queue`);
  };

  const handlePlayNext = (id: string) => {
    const item = upcoming.find((i) => i.id === id);
    if (!item) return;
    control("playNext", { id });
    toast(`Playing: ${item.title}`);
  };

  const handleMoveToTop = (id: string) => {
    const item = upcoming.find((i) => i.id === id);
    if (!item) return;
    control("moveToPosition", { id, toIndex: 0 });
    toast(`Moved "${item.title}" to top`);
  };

  const queueCount = upcoming.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-white">Queue</h2>
          <span className="text-xs text-text-tertiary">
            {queueCount} {queueCount === 1 ? "song" : "songs"}
          </span>
        </div>

        {isHost && queueCount > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            aria-label="Clear waiting queue"
            className="inline-flex h-9 min-h-[44px] items-center gap-1.5 rounded-[var(--radius-xs)] px-2 text-xs font-medium text-text-tertiary transition-colors hover:bg-status-error/10 hover:text-status-error focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Clear All
          </button>
        )}
      </div>

      {queueCount > 0 ? (
        <>
          <p className="px-1 text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
            Up Next
          </p>
          <motion.ul layout className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {upcoming.map((item, idx) => (
                <QueueItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  canControl={isHost}
                  onPlayNext={handlePlayNext}
                  onMoveToTop={handleMoveToTop}
                  onRemove={handleRemove}
                  onView={onViewSong}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </>
      ) : (
        <EmptyQueue onAddSong={onAddSong} />
      )}

      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              role="dialog"
              aria-modal="true"
              aria-label="Clear queue confirmation"
              className="w-full max-w-xs rounded-[var(--radius-sm)] border border-border-default bg-surface-muted p-5"
            >
              <h3 className="text-base font-semibold text-white">Clear waiting queue?</h3>
              <p className="mt-1 text-sm text-text-tertiary">
                Remove all waiting songs. The currently playing song stays.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-[var(--radius-xs)] border border-border-default px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    control("clear");
                    setConfirmClear(false);
                    toast("Queue cleared");
                  }}
                  className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-[var(--radius-xs)] bg-status-error px-4 text-sm font-semibold text-white transition-colors hover:bg-status-error/80"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
