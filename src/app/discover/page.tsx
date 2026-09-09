import type { Metadata } from "next";
import SongList from "@/components/karaoke/SongList";
import Badge from "@/components/ui/Badge";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Discover Trending Karaoke Songs",
  description:
    "Browse trending karaoke songs and find your next performance. Discover popular tracks, queue live YouTube karaoke videos, and own the stage.",
  alternates: {
    canonical: "/discover",
  },
  openGraph: {
    title: "Discover Trending Karaoke Songs | Mcpatenz Karaoke Hub",
    description:
      "Browse trending karaoke songs and find your next performance.",
    url: "/discover",
  },
  twitter: {
    title: "Discover Trending Karaoke Songs | Mcpatenz Karaoke Hub",
    description: "Browse trending karaoke songs and find your next performance.",
  },
};

export default function DiscoverPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen pb-24 lg:pb-10">
        <main className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-xl font-bold sm:text-2xl">Discover</h1>
            <Badge variant="live">Live Now</Badge>
          </div>
          <SongList title="Trending Tracks" />
        </main>
      </div>
    </ToastProvider>
  );
}
