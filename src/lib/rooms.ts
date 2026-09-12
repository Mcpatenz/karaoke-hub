import type { Guest, GuestStatus } from "@/stores/roomStore";
import type { QueueItem } from "@/stores/queueStore";
import { DEFAULT_SETTINGS, type HostSettings } from "@/lib/roomSettings";

export type ViewerRole = "host" | "guest" | "pending" | "denied";

export interface RoomViewer {
  role: ViewerRole;
  guestId?: string;
}

export interface RoomSnapshot {
  type: "snapshot";
  code: string;
  hostName: string;
  guests: Guest[];
  pendingGuests: Guest[];
  settings: HostSettings;
  isLocked: boolean;
  queue: {
    nowPlaying: QueueItem | null;
    upcoming: QueueItem[];
    history: QueueItem[];
  };
  viewer: RoomViewer;
}

export interface RoomClosedEvent {
  type: "closed";
  code: string;
}

interface Room {
  code: string;
  hostName: string;
  hostToken: string;
  guests: Guest[];
  pendingGuests: Guest[];
  settings: HostSettings;
  queue: { nowPlaying: QueueItem | null; upcoming: QueueItem[]; history: QueueItem[] };
  createdAt: number;
}

interface Subscriber {
  viewer: RoomViewer;
  send: (event: RoomSnapshot | RoomClosedEvent) => void;
}

const MAX_GUESTS = 50;

const rooms = new Map<string, Room>();
const roomSubscribers = new Map<string, Set<Subscriber>>();

function randomId(prefix = ""): string {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`;
}

function makeCode(name: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const base = (name.replace(/\s+/g, "").slice(0, 5) || "KARAOKE").toUpperCase();
  if (!rooms.has(base)) return base;
  for (let tries = 0; tries < 24; tries++) {
    const code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    if (!rooms.has(code)) return code;
  }
  return `${base}${Date.now().toString(36).toUpperCase().slice(-2)}`;
}

export function getRoom(code: string): Room | null {
  return rooms.get(code.toUpperCase()) ?? null;
}

export function createRoom(name: string): { code: string; hostToken: string } {
  const code = makeCode(name);
  rooms.set(code, {
    code,
    hostName: name.trim() || "DJ",
    hostToken: randomId("ht-"),
    guests: [],
    pendingGuests: [],
    settings: { ...DEFAULT_SETTINGS },
    queue: { nowPlaying: null, upcoming: [], history: [] },
    createdAt: Date.now(),
  });
  roomSubscribers.set(code, new Set());
  return { code, hostToken: rooms.get(code)!.hostToken };
}

function viewerFor(room: Room, viewer: RoomViewer): RoomViewer {
  if (viewer.role === "host") return { role: "host" as const };
  const guestId = viewer.guestId;
  if (!guestId) return { role: "denied" as const };
  if (room.guests.some((g) => g.id === guestId)) return { role: "guest" as const, guestId };
  if (room.pendingGuests.some((g) => g.id === guestId)) return { role: "pending" as const, guestId };
  return { role: "denied" as const, guestId };
}

function buildSnapshot(room: Room, viewer: RoomViewer): RoomSnapshot {
  return {
    type: "snapshot",
    code: room.code,
    hostName: room.hostName,
    guests: [...room.guests],
    pendingGuests: [...room.pendingGuests],
    settings: room.settings,
    isLocked: !room.settings.roomOpen,
    queue: {
      nowPlaying: room.queue.nowPlaying,
      upcoming: [...room.queue.upcoming],
      history: [...room.queue.history],
    },
    viewer: viewerFor(room, viewer),
  };
}

function broadcast(code: string): void {
  const room = rooms.get(code);
  const subs = roomSubscribers.get(code);
  if (!room || !subs) return;
  for (const sub of subs) {
    try {
      sub.send(buildSnapshot(room, sub.viewer));
    } catch {
      /* one dead subscriber must not block the rest */
    }
  }
}

export function getSnapshot(code: string, viewer: RoomViewer): RoomSnapshot | null {
  const room = rooms.get(code.toUpperCase());
  return room ? buildSnapshot(room, viewer) : null;
}

export function subscribe(code: string, viewer: RoomViewer, send: Subscriber["send"]): () => void {
  const key = code.toUpperCase();
  const set = roomSubscribers.get(key) ?? new Set();
  const sub: Subscriber = { viewer, send };
  set.add(sub);
  roomSubscribers.set(key, set);
  return () => {
    set.delete(sub);
  };
}

export function joinRoom(
  code: string,
  guestId: string,
  name: string,
): { ok: boolean; guestStatus: GuestStatus; error?: string } {
  const room = getRoom(code);
  if (!room) return { ok: false, guestStatus: "idle", error: "Room not found" };
  if (room.guests.some((g) => g.id === guestId)) return { ok: true, guestStatus: "approved" };
  if (room.pendingGuests.some((g) => g.id === guestId)) return { ok: true, guestStatus: "pending" };
  if (room.guests.length >= MAX_GUESTS) {
    return { ok: false, guestStatus: "denied", error: "Room is full" };
  }
  const guest: Guest = { id: guestId, name: name.trim() || "Guest", isHost: false };
  if (room.settings.roomOpen) {
    room.guests.push(guest);
    broadcast(code);
    return { ok: true, guestStatus: "approved" };
  }
  room.pendingGuests.push(guest);
  broadcast(code);
  return { ok: true, guestStatus: "pending" };
}

function authorizeHost(room: Room | null, hostToken: string | undefined): room is Room {
  return !!room && hostToken != null && room.hostToken === hostToken;
}

export function approveGuest(code: string, hostToken: string, guestId: string) {
  const room = getRoom(code);
  if (!authorizeHost(room, hostToken)) return { ok: false, error: "Not authorized" };
  const idx = room.pendingGuests.findIndex((g) => g.id === guestId);
  if (idx < 0) return { ok: false, error: "No pending request" };
  const [guest] = room.pendingGuests.splice(idx, 1);
  room.guests.push(guest);
  broadcast(code);
  return { ok: true };
}

export function denyGuest(code: string, hostToken: string, guestId: string) {
  const room = getRoom(code);
  if (!authorizeHost(room, hostToken)) return { ok: false, error: "Not authorized" };
  const idx = room.pendingGuests.findIndex((g) => g.id === guestId);
  if (idx < 0) return { ok: false, error: "No pending request" };
  room.pendingGuests.splice(idx, 1);
  broadcast(code);
  return { ok: true };
}

export function removeGuest(code: string, hostToken: string, guestId: string) {
  const room = getRoom(code);
  if (!authorizeHost(room, hostToken)) return { ok: false, error: "Not authorized" };
  room.guests = room.guests.filter((g) => g.id !== guestId);
  room.pendingGuests = room.pendingGuests.filter((g) => g.id !== guestId);
  broadcast(code);
  return { ok: true };
}

export function leaveRoom(code: string, guestId: string) {
  const room = getRoom(code);
  if (!room) return { ok: false, error: "Room not found" };
  room.guests = room.guests.filter((g) => g.id !== guestId);
  room.pendingGuests = room.pendingGuests.filter((g) => g.id !== guestId);
  broadcast(code);
  return { ok: true };
}

export function addQueueItem(
  code: string,
  identity: { hostToken?: string; guestId?: string },
  item: QueueItem,
): { ok: boolean; error?: string } {
  const room = getRoom(code);
  if (!room) return { ok: false, error: "Room not found" };
  const isHost = identity.hostToken != null && identity.hostToken === room.hostToken;
  const isGuest = !isHost && !!identity.guestId && room.guests.some((g) => g.id === identity.guestId);
  if (!isHost && !isGuest) return { ok: false, error: "You must be an approved guest to add songs" };

  const normalized = item.title.trim().toLowerCase();
  const inQueue = [room.queue.nowPlaying, ...room.queue.upcoming]
    .filter((i): i is QueueItem => i !== null)
    .some((i) => i.title.toLowerCase() === normalized);
  if (!room.settings.allowDuplicates && inQueue) {
    return { ok: false, error: "This song is already in the queue" };
  }

  if (!isHost && room.settings.guestQueueLimit > 0) {
    const count =
      (room.queue.nowPlaying?.addedBy === item.addedBy ? 1 : 0) +
      room.queue.upcoming.filter((i) => i.addedBy === item.addedBy).length;
    if (count >= room.settings.guestQueueLimit) {
      return { ok: false, error: "Queue limit reached" };
    }
  }

  room.queue.upcoming.push(item);
  broadcast(code);
  return { ok: true };
}

export type QueueControlAction = "playNext" | "remove" | "moveToPosition" | "skip" | "complete" | "clear";

export function queueControl(
  code: string,
  hostToken: string,
  action: QueueControlAction,
  payload: { id?: string; toIndex?: number } = {},
) {
  const room = getRoom(code);
  if (!authorizeHost(room, hostToken)) return { ok: false, error: "Not authorized" };

  switch (action) {
    case "playNext": {
      const item = room.queue.upcoming.find((i) => i.id === payload.id);
      if (!item) return { ok: false, error: "Song not in queue" };
      room.queue.history = room.queue.nowPlaying ? [...room.queue.history, room.queue.nowPlaying] : room.queue.history;
      room.queue.nowPlaying = item;
      room.queue.upcoming = room.queue.upcoming.filter((i) => i.id !== item.id);
      break;
    }
    case "remove": {
      room.queue.upcoming = room.queue.upcoming.filter((i) => i.id !== payload.id);
      break;
    }
    case "moveToPosition": {
      const arr = room.queue.upcoming;
      const fromIdx = arr.findIndex((i) => i.id === payload.id);
      if (fromIdx < 0) return { ok: false, error: "Song not in queue" };
      const toIdx = Math.max(0, Math.min(payload.toIndex ?? 0, arr.length - 1));
      if (fromIdx !== toIdx) {
        const next = [...arr];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        room.queue.upcoming = next;
      }
      break;
    }
    case "skip":
    case "complete": {
      if (!room.queue.nowPlaying) return { ok: false, error: "Nothing playing" };
      const next = room.queue.upcoming[0] ?? null;
      room.queue.history = [...room.queue.history, room.queue.nowPlaying];
      room.queue.nowPlaying = next;
      room.queue.upcoming = room.queue.upcoming.slice(1);
      break;
    }
    case "clear": {
      room.queue.upcoming = [];
      break;
    }
    default:
      return { ok: false, error: "Unknown action" };
  }

  broadcast(code);
  return { ok: true };
}

export function updateRoomSettings(code: string, hostToken: string, settings: HostSettings) {
  const room = getRoom(code);
  if (!authorizeHost(room, hostToken)) return { ok: false, error: "Not authorized" };
  room.settings = { ...settings };
  broadcast(code);
  return { ok: true };
}

export function endRoom(code: string, hostToken: string) {
  const room = getRoom(code);
  if (!authorizeHost(room, hostToken)) return { ok: false, error: "Not authorized" };
  const key = code.toUpperCase();
  const subs = roomSubscribers.get(key);
  const closed: RoomClosedEvent = { type: "closed", code: key };
  if (subs) {
    for (const sub of subs) {
      try {
        sub.send(closed);
      } catch {
        /* ignore */
      }
    }
  }
  roomSubscribers.delete(key);
  rooms.delete(key);
  return { ok: true };
}