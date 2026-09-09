import type { Metadata } from "next";
import RoomContent from "./RoomContent";

export const metadata: Metadata = {
  title: "Karaoke Room — Live Session",
  description:
    "Your live karaoke room. Share the room code or QR code so guests can queue songs and sing along in real time with synchronized lyrics.",
  robots: { index: false },
  openGraph: {
    title: "Karaoke Room — Live Session | Mcpatenz Karaoke Hub",
    description:
      "Your live karaoke room. Queue songs, follow lyrics, and sing with friends.",
  },
  twitter: {
    title: "Karaoke Room — Live Session | Mcpatenz Karaoke Hub",
    description:
      "Your live karaoke room. Queue songs, follow lyrics, and sing with friends.",
  },
};

export default function RoomPage() {
  return <RoomContent />;
}
