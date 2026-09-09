import type { Metadata } from "next";
import HostRoomView from "@/components/HostRoomView";

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `ROOM: ${code} — Mcpatenz Karaoke Hub`,
    description:
      "Your live karaoke room. Share the room code or QR code so guests can queue songs and sing along in real time.",
    robots: { index: false },
  };
}

export default async function HostRoomPage({ params }: Props) {
  const { code } = await params;
  return <HostRoomView roomCode={code} />;
}