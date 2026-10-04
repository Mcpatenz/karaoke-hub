"use client";

import { useEffect } from "react";
import { useRoomStore } from "@/stores/roomStore";
import { useQueueStore } from "@/stores/queueStore";
import { roomApi, type RoomSnapshot } from "@/lib/roomApi";

/**
 * Connects to the room's realtime stream and mirrors server state into the
 * room + queue Zustand stores. Also restores a host/guest identity from
 * sessionStorage so reloads keep working.
 *
 * A visitor who opens a room link without an identity is joined automatically
 * as a guest, so the room renders in full instead of stalling on the approval
 * screen. Host-only actions still require the host token.
 */
export function useRoomRealtime(roomCode: string | undefined) {
  useEffect(() => {
    const code = roomCode?.toUpperCase();
    if (!code) return;

    const store = useRoomStore.getState();
    let isHost = store.isHost;
    let hostToken = store.hostToken;
    let guestId = store.guestId;
    let cancelled = false;

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

    const connect = (identity: { hostToken?: string | null; guestId?: string | null }) => {
      if (cancelled) return () => {};

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
    };

    // No stored identity: join on the fly so the room shows up in full. If the
    // host has the room locked or approval is required we still land behind the
    // gate instead of pretending to be in.
    if (!isHost && hostToken === null && !guestId) {
      let teardown: () => void = () => {};
      const newGuestId = `g-${Math.random().toString(36).slice(2, 10)}`;
      const guestName = store.guestName?.trim() || "Guest";
      void roomApi
        .joinRoom(code, newGuestId, guestName, { autoApprove: true })
        .then((res) => {
          if (cancelled) return;
          if (!res.ok) {
            useRoomStore.setState({ guestStatus: "pending" });
            return;
          }
          roomApi.saveGuestIdentity(code, newGuestId, guestName);
          useRoomStore.setState({
            guestId: newGuestId,
            guestName,
            isHost: false,
            guestStatus: "approved",
          });
          teardown = connect({ guestId: newGuestId });
        })
        .catch(() => {
          if (!cancelled) useRoomStore.setState({ guestStatus: "pending" });
        });

      return () => {
        cancelled = true;
        teardown();
      };
    }

    const identity = isHost ? { hostToken } : { guestId };
    const unsubscribe = connect(identity);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [roomCode]);
}