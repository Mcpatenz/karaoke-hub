# Karaoke Hub 🎤

A real-time karaoke room where a host starts a session and guests join to queue songs and sing along. Built with **Next.js 15**, **React 19**, **Tailwind CSS v4**, **Zustand**, and **Framer Motion**.

## ✨ How rooms work

- **Host** starts a room from the landing page. The server issues a host token (stored per-tab) that authenticates all host-only actions.
- **Joining requires approval.** Guests submit a join request with their name; the host approves or denies it from the Guests tab. The guest's device updates live over Server-Sent Events (SSE) the moment the host decides.
- **Role permissions:**
  - **Host** — full control: approve/deny/remove guests, play-next, reorder, remove, skip, clear the queue, and change room settings.
  - **Guest** — can **add songs only**. Queue controls (reorder, play-next, remove, skip, clear) are hidden from guests and rejected by the server.
  - Host can open the room (`Room Locker` off) to auto-approve joiners, or keep it locked (default) to review every request.
- **Queue & room state sync live** across every connected device via the realtime stream; song adds and queue changes by the host are broadcast to all guests.
- The host can also end the session, which closes the room for everyone.

## 🚀 Getting Started

```bash
npm install
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build
npm run start     # serve the production build (REQUIRED for realtime)
npm run lint      # oxlint
```

> **Realtime in production:** rooms live in an in-memory registry on a single Node process, streamed over SSE. Use `npm run start` (a persistent Node server) — plain serverless deploys without a persistent runtime won't keep rooms or SSE connections alive.

## 🛠 Tech Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** (CSS-first config in `globals.css`)
- **Zustand** for client state (room, queue, player, search)
- **Framer Motion** animations + **Lucide React** icons
- **SSE + REST** for the realtime backend (`src/lib/rooms.ts`, `src/app/api/rooms/**`)
- YouTube search via API key or key-less proxy (`/api/youtube/search`)

## 📂 Key structure

```
src/
├── app/api/rooms/            # Realtime backend: create, join, stream (SSE), actions
├── app/host/[code]/          # Live room page
├── components/karaoke/       # Host room, queue, add-song, guest list, settings, player
├── hooks/useRoomRealtime.ts  # SSE → Zustand sync for the live room
├── lib/rooms.ts              # Server-side in-memory room registry + event broadcast
├── lib/roomApi.ts            # Client API + SSE subscription + identity persistence
├── lib/roomSettings.ts       # Shared HostSettings + defaults
└── stores/                   # Zustand stores (room, queue, player, search)
```