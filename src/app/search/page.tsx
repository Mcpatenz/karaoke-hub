import SongSearch from "@/components/karaoke/SongSearch";
import { ToastProvider } from "@/components/ui/Toast";

export default function SearchPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen pb-24 lg:pb-10">
        <main className="mx-auto max-w-3xl px-4 pt-10 lg:px-6">
          <h1 className="mb-6 text-xl font-bold">Search</h1>
          <SongSearch />
        </main>
      </div>
    </ToastProvider>
  );
}