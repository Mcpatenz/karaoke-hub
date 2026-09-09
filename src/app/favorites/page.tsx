import SongList from "@/components/karaoke/SongList";
import { ToastProvider } from "@/components/ui/Toast";

export default function FavoritesPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen pb-24 lg:pb-10">
        <main className="mx-auto max-w-5xl px-4 pt-10 lg:px-6">
          <h1 className="mb-1 text-xl font-bold">Favorites</h1>
          <p className="mb-6 text-sm text-text-tertiary">
            Songs you sing again and again.
          </p>
          <SongList title="Your Favorites" />
        </main>
      </div>
    </ToastProvider>
  );
}