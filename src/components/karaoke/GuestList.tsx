"use client";

import { X, Crown } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface Guest {
  id: string;
  name: string;
  isHost?: boolean;
}

interface GuestListProps {
  guests: Guest[];
  currentGuestName?: string;
  isHost?: boolean;
  onRemove?: (id: string) => void;
  className?: string;
}

export default function GuestList({
  guests,
  currentGuestName,
  isHost = false,
  onRemove,
  className = "",
}: GuestListProps) {
  return (
    <section aria-label="Guests in room" className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Guests
          <Badge variant="live">
            <span aria-hidden="true">●</span> LIVE
          </Badge>
        </h2>
        <span className="text-sm text-text-tertiary">{guests.length} guests</span>
      </div>

      {guests.length === 0 ? (
        <div className="rounded-[var(--radius-sm)] border border-border-default bg-surface-muted p-5 text-center">
          <p className="text-sm text-text-tertiary">No guests in this room yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {guests.map((guest) => (
            <li
              key={guest.id}
              className="flex items-center gap-3 rounded-[var(--radius-xs)] border border-border-default bg-surface-raised px-3 py-2.5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-strong text-xs font-semibold uppercase text-text-tertiary">
                {guest.name.charAt(0) || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {guest.name}
                  {guest.name === currentGuestName && (
                    <span className="ml-2 text-xs text-text-tertiary">(you)</span>
                  )}
                </p>
              </div>
              {guest.isHost && (
                <Crown className="h-4 w-4 shrink-0 text-accent" aria-label="Host" />
              )}
              {isHost && !guest.isHost && (
                <button
                  onClick={() => onRemove?.(guest.id)}
                  aria-label={`Remove ${guest.name} from room`}
                  className="grid h-8 w-8 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-status-error/10 hover:text-status-error focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}