import SongList from "@/components/karaoke/SongList";
import Badge from "@/components/ui/Badge";
import { ToastProvider } from "@/components/ui/Toast";

export default function DiscoverPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen pb-24 lg:pb-10">
        <main className="mx-auto max-w-5xl px-4 pt-10 lg:px-6">
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-xl font-bold">Discover</h1>
            <Badge variant="live">Live Now</Badge>
          </div>
          <SongList title="Trending Tracks" />
        </main>
      </div>
    </ToastProvider>
  );
}