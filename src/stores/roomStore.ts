import { create } from "zustand";

interface Guest {
  id: string;
  name: string;
  isHost: boolean;
}

interface RoomState {
  roomCode: string;
  hostName: string;
  guestName: string;
  guests: Guest[];
  isLocked: boolean;
  maxGuests: number;
  setRoomCode: (code: string) => void;
  setHostName: (name: string) => void;
  setGuestName: (name: string) => void;
  addGuest: (guest: Guest) => void;
  removeGuest: (id: string) => void;
  setLocked: (locked: boolean) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomCode: "",
  hostName: "",
  guestName: "",
  guests: [],
  isLocked: false,
  maxGuests: 50,
  setRoomCode: (roomCode) => set({ roomCode }),
  setHostName: (hostName) => set({ hostName }),
  setGuestName: (guestName) => set({ guestName }),
  addGuest: (guest) => set((s) => ({ guests: [...s.guests, guest] })),
  removeGuest: (id) => set((s) => ({ guests: s.guests.filter((g) => g.id !== id) })),
  setLocked: (isLocked) => set({ isLocked }),
  reset: () => set({ roomCode: "", hostName: "", guestName: "", guests: [], isLocked: false }),
}));
