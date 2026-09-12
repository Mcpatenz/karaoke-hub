"use client";

import { useEffect } from "react";
import { useRoomStore } from "@/stores/roomStore";
import { useQueueStore } from "@/stores/queueStore";
import { roomApi, type RoomSnapshot } from "@/lib/roomApi";

/**
 * Connects to the room's realtime stream and mirrors server state into the
 * room + queue Zustand stores. Also restores a host/guest identity from
 * sessionStorage so reloads keep working.
 */
export function useRoomRealtime(roomCode: string | undefined) {
  useEffect(() => {
    const code = roomCode?.toUpperCase();
    if (!code) return;

    const store = useRoomStore.getState();
    let isHost = store.isHost;
    let hostToken = store.hostToken;
    let guestId = store.guestId;

    // A host token in sessionStorage means this tab owns the room.
    if (!hostToken) {
      const saved = roomApi.readHostIdentity(code);
      if (saved) {
        hostToken = saved;
        isHost = true;
        useRoomStore.setState({ hostToken: saved, isHost: true });
      }
    }

    // Otherwise fall back to a saved guest identity.
    if (!isHost && hostToken === null && !guestId) {
      const saved = roomApi.readGuestIdentity(code);
      if (saved) {
        guestId = saved.guestId;
        useRoomStore.setState({ guestId: saved.guestId, guestName: saved.name || store.guestName });
      }
    }

    // A visitor with no identity waits behind the approval gate.
    if (!isHost && hostToken === null && !guestId) {
      useRoomStore.setState({ guestStatus: "pending" });
      return;
    }

    const identity = isHost ? { hostToken } : { guestId };

    const apply = (snap: RoomSnapshot) => {
      const role = snap.viewer.role;
      const guestStatus =
        role === "host" || role === "guest"
          ? "approved"
          : role === "pending"
            ? "pending"
            : "denied";

      useRoomStore.setState({
        roomCode: snap.code,
        hostName: snap.hostName,
        guests: snap.guests,
        pendingGuests: snap.pendingGuests,
        settings: snap.settings,
        isLocked: snap.isLocked,
        requiresApproval: !snap.settings.roomOpen,
        guestStatus,
      });
      useQueueStore.setState({
        nowPlaying: snap.queue.nowPlaying,
        upcoming: snap.queue.upcoming,
        history: snap.queue.history,
      });
    };

    const unsubscribe = roomApi.subscribeRoom(code, identity, {
      onSnapshot: apply,
      onClosed: () => {
        roomApi.clearHostIdentity(code);
        roomApi.clearGuestIdentity(code);
        useRoomStore.getState().reset();
        if (window.location.pathname.toLowerCase() !== "/") {
          window.location.href = "/";
        }
      },
      onError: () => {
        /* EventSource reconnects automatically */
      },
    });

    return unsubscribe;
  }, [roomCode]);
}