import type { Metadata } from "next";
import SongSearch from "@/components/karaoke/SongSearch";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Search Karaoke Songs",
  description:
    "Search thousands of karaoke songs by title, artist, or album. Find the perfect track for your next performance and queue it instantly.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Search Karaoke Songs | Mcpatenz Karaoke Hub",
    description:
      "Search thousands of karaoke songs by title, artist, or album.",
    url: "/search",
  },
  twitter: {
    title: "Search Karaoke Songs | Mcpatenz Karaoke Hub",
    description: "Search thousands of karaoke songs by title, artist, or album.",
  },
};

export default function SearchPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen pb-24 lg:pb-10">
        <main className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-xl font-bold sm:text-2xl">Search</h1>
          <SongSearch />
        </main>
      </div>
    </ToastProvider>
  );
}
