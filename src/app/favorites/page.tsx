import type { Metadata } from "next";
import SongList from "@/components/karaoke/SongList";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Your Favorite Karaoke Songs",
  description:
    "Keep track of your most-loved karaoke songs. Build your personal favorites list and never forget the tracks you sing again and again.",
  alternates: {
    canonical: "/favorites",
  },
  openGraph: {
    title: "Your Favorite Karaoke Songs | Mcpatenz Karaoke Hub",
    description:
      "Keep track of your most-loved karaoke songs.",
    url: "/favorites",
  },
  twitter: {
    title: "Your Favorite Karaoke Songs | Mcpatenz Karaoke Hub",
    description: "Keep track of your most-loved karaoke songs.",
  },
};

export default function FavoritesPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen pb-24 lg:pb-10">
        <main className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 lg:px-8">
          <h1 className="mb-1 text-xl font-bold sm:text-2xl">Favorites</h1>
          <p className="mb-6 text-sm text-text-tertiary">
            Songs you sing again and again.
          </p>
          <SongList title="Your Favorites" />
        </main>
      </div>
    </ToastProvider>
  );
}
