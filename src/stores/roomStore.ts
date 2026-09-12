import { create } from "zustand";
import { DEFAULT_SETTINGS, type HostSettings } from "@/lib/roomSettings";

export interface Guest {
  id: string;
  name: string;
  isHost: boolean;
}

export type GuestStatus = "idle" | "pending" | "approved" | "denied";

interface RoomState {
  roomCode: string;
  hostName: string;
  guestName: string;
  guests: Guest[];
  pendingGuests: Guest[];
  isLocked: boolean;
  requiresApproval: boolean;
  isHost: boolean;
  guestStatus: GuestStatus;
  maxGuests: number;
  hostToken: string | null;
  guestId: string | null;
  settings: HostSettings;
  setRoomCode: (code: string) => void;
  setHostName: (name: string) => void;
  setGuestName: (name: string) => void;
  setIsHost: (isHost: boolean) => void;
  setHostToken: (token: string | null) => void;
  setGuestId: (id: string | null) => void;
  setGuestStatus: (status: GuestStatus) => void;
  applySnapshot: (snap: {
    roomCode: string;
    hostName: string;
    guests: Guest[];
    pendingGuests: Guest[];
    settings: HostSettings;
    isLocked: boolean;
    guestStatus: GuestStatus;
  }) => void;
  addGuest: (guest: Guest) => void;
  removeGuest: (id: string) => void;
  requestJoin: (guest: Guest) => void;
  approveGuest: (id: string) => void;
  denyGuest: (id: string) => void;
  setLocked: (locked: boolean) => void;
  setRequiresApproval: (requires: boolean) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomCode: "",
  hostName: "",
  guestName: "",
  guests: [],
  pendingGuests: [],
  isLocked: false,
  requiresApproval: true,
  isHost: false,
  guestStatus: "idle",
  maxGuests: 50,
  hostToken: null,
  guestId: null,
  settings: { ...DEFAULT_SETTINGS },
  setRoomCode: (roomCode) => set({ roomCode }),
  setHostName: (hostName) => set({ hostName }),
  setGuestName: (guestName) => set({ guestName }),
  setIsHost: (isHost) => set({ isHost }),
  setHostToken: (hostToken) => set({ hostToken }),
  setGuestId: (guestId) => set({ guestId }),
  setGuestStatus: (guestStatus) => set({ guestStatus }),
  applySnapshot: ({ roomCode, hostName, guests, pendingGuests, settings, isLocked, guestStatus }) =>
    set({ roomCode, hostName, guests, pendingGuests, settings, isLocked, guestStatus }),
  addGuest: (guest) => set((s) => ({ guests: [...s.guests, guest] })),
  removeGuest: (id) =>
    set((s) => ({
      guests: s.guests.filter((g) => g.id !== id),
    })),
  requestJoin: (guest) =>
    set((s) => {
      if (!s.requiresApproval) {
        return {
          guests: [...s.guests, guest],
          guestStatus: "approved",
        };
      }
      return {
        pendingGuests: [...s.pendingGuests, guest],
        guestStatus: "pending",
      };
    }),
  approveGuest: (id) =>
    set((s) => {
      const guest = s.pendingGuests.find((g) => g.id === id);
      if (!guest) return s;
      return {
        pendingGuests: s.pendingGuests.filter((g) => g.id !== id),
        guests: [...s.guests, guest],
      };
    }),
  denyGuest: (id) =>
    set((s) => ({
      pendingGuests: s.pendingGuests.filter((g) => g.id !== id),
    })),
  setLocked: (isLocked) => set({ isLocked }),
  setRequiresApproval: (requiresApproval) => set({ requiresApproval }),
  reset: () =>
    set({
      roomCode: "",
      hostName: "",
      guestName: "",
      guests: [],
      pendingGuests: [],
      isLocked: false,
      requiresApproval: true,
      isHost: false,
      guestStatus: "idle",
      hostToken: null,
      guestId: null,
      settings: { ...DEFAULT_SETTINGS },
    }),
}));
