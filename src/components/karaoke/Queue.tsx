"use client";

import { ChevronUp, ChevronDown, X, Trash2, Play, SkipForward } from "lucide-react";
import { useQueueStore } from "@/stores/queueStore";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface QueueProps {
  isHost?: boolean;
  className?: string;
}

export default function Queue({ isHost = false, className = "" }: QueueProps) {
  const { nowPlaying, upcoming, removeFromQueue, moveUp, moveDown, playNext, skipCurrent, clearQueue, history } =
    useQueueStore();
  const { toast } = useToast();

  const removeItem = (id: string, title: string) => {
    removeFromQueue(id);
    toast(`${title} removed from queue`);
  };

  return (
    <section aria-label="Song queue" className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Queue</h2>
        {isHost && upcoming.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => { clearQueue(); toast("Queue cleared"); }}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>

      {nowPlaying ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-accent/30 bg-accent/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <Badge variant="live">Now Playing</Badge>
            {isHost && (
              <button
                onClick={() => { skipCurrent(); toast("Skipped to next song"); }}
                aria-label="Skip current song"
                className="grid h-10 w-10 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-surface-raised hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
              >
                <SkipForward className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="truncate text-base font-semibold text-text-primary">{nowPlaying.title}</p>
          <p className="truncate text-sm text-text-tertiary">{nowPlaying.addedBy}</p>
        </div>
      ) : (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-border-default bg-surface-muted p-4">
          <p className="text-sm font-medium text-text-tertiary">Your queue is empty.</p>
          <p className="mt-0.5 text-xs text-gray-500">Search for a song to get started.</p>
        </div>
      )}

      {upcoming.length > 0 ? (
        <ol className="space-y-2">
          {upcoming.map((item, index) => (
            <li
              key={item.id}
              className="group flex items-center gap-3 rounded-[var(--radius-xs)] border border-border-default bg-surface-raised px-3 py-2.5"
            >
              <span className="w-6 shrink-0 text-center font-mono text-xs text-text-tertiary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                <p className="truncate text-xs text-text-tertiary">{item.addedBy}</p>
              </div>

              {isHost && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => moveUp(item.id)}
                    disabled={index === 0}
                    aria-label={`Move ${item.title} up`}
                    className="grid h-8 w-8 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-surface-strong hover:text-text-primary disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => moveDown(item.id)}
                    disabled={index === upcoming.length - 1}
                    aria-label={`Move ${item.title} down`}
                    className="grid h-8 w-8 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-surface-strong hover:text-text-primary disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => playNext(item.id)}
                    aria-label={`Play ${item.title} next`}
                    className="grid h-8 w-8 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id, item.title)}
                    aria-label={`Remove ${item.title} from queue`}
                    className="grid h-8 w-8 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-status-error/10 hover:text-status-error focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {!isHost && (
                <button
                  onClick={() => removeItem(item.id, item.title)}
                  aria-label={`Remove ${item.title} from queue`}
                  className="grid h-8 w-8 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-status-error/10 hover:text-status-error focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ol>
      ) : (
        !nowPlaying && (
          <div className="rounded-[var(--radius-xs)] border border-border-default bg-surface-muted p-4 text-center">
            <p className="text-sm text-text-tertiary">Nothing queued yet.</p>
          </div>
        )
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-tertiary">
            History
          </h3>
          <p className="text-xs text-gray-500">
            {history.map((h) => h.title).join(" · ")}
          </p>
        </div>
      )}
    </section>
  );
}