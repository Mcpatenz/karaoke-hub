import type { Song } from "@/stores/searchStore";

/**
 * SongProvider abstraction.
 *
 * The karaoke host room talks only to this interface, so the underlying
 * catalog can be swapped without touching the UI.
 *
 * Every lookup goes through /api/youtube/search, which calls the official
 * YouTube Data API v3 with YOUTUBE_API_KEY on the server. There is no bundled
 * mock catalog anymore — a broken key or an exhausted quota surfaces as a real
 * error instead of silently returning fake songs.
 */
export interface SongProvider {
  searchSongs(query: string): Promise<Song[]>;
  getSong(id: string): Promise<Song | null>;
  getPopularSongs(): Promise<Song[]>;
  getTopPlayed(limit?: number): Promise<Song[]>;
}

interface RouteVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  views?: number;
  duration?: string;
  publishedTime?: string;
}

export class SongSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SongSearchError";
  }
}

/**
 * Iconic songs used to seed the "Top Played" list. A broad query like
 * "top karaoke hits" returns medleys and unknown channels, so the list is built
 * from a few well-known titles that reliably have real karaoke versions.
 */
const TOP_PLAYED_SEEDS = [
  "Bohemian Rhapsody Queen",
  "Dancing Queen ABBA",
  "My Way Frank Sinatra",
  "I Will Always Love You Whitney Houston",
];

/** Results are cached briefly so reopening the panel does not re-bill quota. */
const TOP_PLAYED_TTL_MS = 5 * 60 * 1000;
let topPlayedCache: { at: number; songs: Song[] } | null = null;

async function fetchVideos(query: string): Promise<RouteVideo[]> {
  let res: Response;
  try {
    res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
  } catch {
    throw new SongSearchError("Could not reach the search service. Check your connection.");
  }

  const data = (await res.json().catch(() => ({}))) as {
    videos?: RouteVideo[];
    error?: string;
  };

  if (!res.ok) {
    throw new SongSearchError(data.error ?? `Song search failed (${res.status})`);
  }
  return data.videos ?? [];
}

function toSong(video: RouteVideo): Song {
  return {
    id: `yt-${video.videoId}`,
    videoId: video.videoId,
    title: cleanTitle(video.title),
    artist: video.channel || "Unknown channel",
    channel: video.channel,
    artwork: video.thumbnail,
    source: "youtube",
    plays: video.views,
    duration: parseDuration(video.duration),
  };
}

function dedupe(songs: Song[]): Song[] {
  const seen = new Set<string>();
  const out: Song[] = [];
  for (const song of songs) {
    const key = song.videoId ?? song.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(song);
  }
  return out;
}

class YouTubeSongProvider implements SongProvider {
  async searchSongs(query: string): Promise<Song[]> {
    const q = query.trim();
    if (!q) return [];
    const videos = await fetchVideos(q);
    return dedupe(videos.map(toSong));
  }

  async getSong(id: string): Promise<Song | null> {
    if (!id.startsWith("yt-")) return null;
    const videoId = id.replace("yt-", "");
    return {
      id,
      videoId,
      title: "YouTube song",
      artist: "YouTube",
      source: "youtube",
      artwork: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  async getPopularSongs(): Promise<Song[]> {
    return this.getTopPlayed(8);
  }

  async getTopPlayed(limit = 10): Promise<Song[]> {
    if (topPlayedCache && Date.now() - topPlayedCache.at < TOP_PLAYED_TTL_MS) {
      return topPlayedCache.songs.slice(0, limit);
    }

    const settled = await Promise.allSettled(TOP_PLAYED_SEEDS.map((seed) => fetchVideos(seed)));
    const batches = settled
      .filter((r): r is PromiseFulfilledResult<RouteVideo[]> => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .map(toSong);

    // Every seed failed means a real API problem, so report it instead of
    // showing an empty "Top 10 Played" list.
    if (batches.length === 0) {
      const firstError = settled.find(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );
      throw firstError?.reason instanceof Error
        ? firstError.reason
        : new SongSearchError("Could not load song suggestions.");
    }

    const songs = dedupe(batches).sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0));
    topPlayedCache = { at: Date.now(), songs };
    return songs.slice(0, limit);
  }
}

/** Keep the original song title by trimming common karaoke suffixes. */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*\(karaoke.*?\)\s*$/i, "")
    .replace(/\s*-\s*karaoke.*$/i, "")
    .replace(/\s+([Kk]araoke|[Oo]fficial)\s*$/i, "")
    .trim();
}

/** Convert a "3:20", "1:03:20" or raw-seconds duration to seconds. */
function parseDuration(label?: string): number | undefined {
  if (!label) return undefined;
  const parts = label
    .split(":")
    .map((p) => Number(p.trim()))
    .filter((n) => Number.isFinite(n));
  if (parts.length === 0) return undefined;
  let total = 0;
  for (const part of parts) total = total * 60 + part;
  return total;
}

// Live YouTube results only — no mock catalog.
export const songProvider: SongProvider = new YouTubeSongProvider();