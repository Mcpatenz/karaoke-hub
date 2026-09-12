import type { Guest, GuestStatus } from "@/stores/roomStore";
import type { QueueItem } from "@/stores/queueStore";
import type { HostSettings } from "@/lib/roomSettings";

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

interface JsonResult {
  ok: boolean;
  status: number;
  error?: string;
  [key: string]: unknown;
}

async function post(path: string, body: unknown): Promise<JsonResult> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await res.json()) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, ...data };
  } catch {
    return { ok: false, status: 0, error: "Network error" };
  }
}

export function createRoom(name: string): Promise<{ ok: boolean; code?: string; hostToken?: string; error?: string }> {
  return post("/api/rooms/create", { name }).then((r) => ({
    ok: r.ok,
    code: r.code as string | undefined,
    hostToken: r.hostToken as string | undefined,
    error: r.error,
  }));
}

export function joinRoom(
  code: string,
  guestId: string,
  name: string,
): Promise<{ ok: boolean; guestStatus?: GuestStatus; error?: string }> {
  return post(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/join`, { guestId, name }).then((r) => ({
    ok: r.ok,
    guestStatus: r.guestStatus as GuestStatus | undefined,
    error: r.error,
  }));
}

export function approveGuest(code: string, hostToken: string, guestId: string): Promise<boolean> {
  return post(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/actions`, {
    action: "approve",
    hostToken,
    guestId,
  }).then((r) => r.ok);
}

export function denyGuest(code: string, hostToken: string, guestId: string): Promise<boolean> {
  return post(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/actions`, {
    action: "deny",
    hostToken,
    guestId,
  }).then((r) => r.ok);
}

export function removeGuest(code: string, hostToken: string, guestId: string): Promise<boolean> {
  return post(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/actions`, {
    action: "remove",
    hostToken,
    guestId,
  }).then((r) => r.ok);
}

export function leaveRoom(code: string, guestId: string): Promise<boolean> {
  return post(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/actions`, {
    action: "leave",
    guestId,
  }).then((r) => r.ok);
}

export function endRoom(code: string, hostToken: string): Promise<boolean> {
  return post(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/actions`, {
    action: "end",
    hostToken,
  }).then((r) => r.ok);
}

export function addSong(
  code: string,
  item: QueueItem,
  identity: { hostToken?: string; guestId?: string },
): Promise<{ ok: boolean; error?: string }> {
  return post(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/actions`, {
    action: "add-song",
    hostToken: identity.hostToken,
    guestId: identity.guestId,
    item,
  }).then((r) => ({ ok: r.ok, error: r.error }));
}

export function queueControl(
  code: string,
  hostToken: string,
  control: string,
  payload: { id?: string; toIndex?: number } = {},
): Promise<boolean> {
  return post(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/actions`, {
    action: "queue-control",
    control,
    hostToken,
    id: payload.id,
    toIndex: payload.toIndex,
  }).then((r) => r.ok);
}

export function updateSettings(code: string, hostToken: string, settings: HostSettings): Promise<boolean> {
  return post(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/actions`, {
    action: "settings",
    hostToken,
    settings,
  }).then((r) => r.ok);
}

export interface RoomSubscriptionOptions {
  onSnapshot?: (snap: RoomSnapshot) => void;
  onClosed?: () => void;
  onError?: () => void;
}

export function subscribeRoom(
  code: string,
  identity: { hostToken?: string | null; guestId?: string | null },
  options: RoomSubscriptionOptions = {},
): () => void {
  const params = new URLSearchParams();
  if (identity.hostToken) params.set("hostToken", identity.hostToken);
  else if (identity.guestId) params.set("guestId", identity.guestId);

  const es = new EventSource(`/api/rooms/${encodeURIComponent(code.toUpperCase())}/stream?${params.toString()}`);
  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data) as { type?: string; [key: string]: unknown };
      if (data.type === "closed") {
        options.onClosed?.();
        es.close();
        return;
      }
      if (data.type === "snapshot") options.onSnapshot?.(data as unknown as RoomSnapshot);
    } catch {
      /* ignore malformed frames */
    }
  };
  es.onerror = () => {
    options.onError?.();
  };
  return () => es.close();
}

// --- host / guest identity persistence (survives tab reloads) ---

function hostKey(code: string): string {
  return `kh:host:${code.toUpperCase()}`;
}

function guestKey(code: string): string {
  return `kh:guest:${code.toUpperCase()}`;
}

export function saveHostIdentity(code: string, hostToken: string): void {
  try {
    sessionStorage.setItem(hostKey(code), hostToken);
  } catch {
    /* storage unavailable */
  }
}

export function readHostIdentity(code: string): string | null {
  try {
    return sessionStorage.getItem(hostKey(code));
  } catch {
    return null;
  }
}

export function clearHostIdentity(code: string): void {
  try {
    sessionStorage.removeItem(hostKey(code));
  } catch {
    /* ignore */
  }
}

export function saveGuestIdentity(code: string, guestId: string, name: string): void {
  try {
    sessionStorage.setItem(guestKey(code), JSON.stringify({ guestId, name }));
  } catch {
    /* ignore */
  }
}

export function readGuestIdentity(code: string): { guestId: string; name: string } | null {
  try {
    const raw = sessionStorage.getItem(guestKey(code));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { guestId?: string; name?: string };
    if (!parsed.guestId) return null;
    return { guestId: parsed.guestId, name: parsed.name ?? "" };
  } catch {
    return null;
  }
}

export function clearGuestIdentity(code: string): void {
  try {
    sessionStorage.removeItem(guestKey(code));
  } catch {
    /* ignore */
  }
}

export const roomApi = {
  createRoom,
  joinRoom,
  approveGuest,
  denyGuest,
  removeGuest,
  leaveRoom,
  endRoom,
  addSong,
  queueControl,
  updateSettings,
  subscribeRoom,
  saveHostIdentity,
  readHostIdentity,
  clearHostIdentity,
  saveGuestIdentity,
  readGuestIdentity,
  clearGuestIdentity,
};