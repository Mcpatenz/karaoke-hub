import { MOCK_SONGS } from "@/lib/mockData";
import type { Song } from "@/stores/searchStore";

/**
 * SongProvider abstraction.
 *
 * The karaoke host room talks only to this interface, so the underlying
 * catalog can be swapped without touching the UI.
 *
 * By default a MOCK provider powers the UI so it works without any keys.
 * When an `NEXT_PUBLIC_YOUTUBE_API_KEY` is provided, live karaoke video
 * search is used (official YouTube Data API v3) with the mock catalog as a
 * fallback if the API call fails.
 */
export interface SongProvider {
  searchSongs(query: string): Promise<Song[]>;
  getSong(id: string): Promise<Song | null>;
  getPopularSongs(): Promise<Song[]>;
  getTopPlayed(limit?: number): Promise<Song[]>;
}

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
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

/** Debounce-safe local search over the mock catalog. */
class MockSongProvider implements SongProvider {
  async searchSongs(query: string): Promise<Song[]> {
    await delay(250);
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOCK_SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album ?? "").toLowerCase().includes(q),
    );
  }

  async getSong(id: string): Promise<Song | null> {
    await delay(80);
    return MOCK_SONGS.find((s) => s.id === id) ?? null;
  }

  async getPopularSongs(): Promise<Song[]> {
    await delay(120);
    return MOCK_SONGS.slice(0, 8);
  }

  async getTopPlayed(limit = 10): Promise<Song[]> {
    await delay(150);
    return [...MOCK_SONGS]
      .sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0))
      .slice(0, limit);
  }
}

/**
 * Live karaoke video search via the official YouTube Data API v3.
 *
 * Requires NEXT_PUBLIC_YOUTUBE_API_KEY. Falls back to the mock provider when
 * the key is missing or the request fails, so the UI never breaks.
 */
class YouTubeSongProvider implements SongProvider {
  private mock = new MockSongProvider();
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  }

  async searchSongs(query: string): Promise<Song[]> {
    const q = query.trim();
    if (!q) return [];

    // Prefer the official YouTube Data API when a key is configured.
    if (this.apiKey) {
      try {
        const apiSongs = await this.searchWithApiKey(q);
        if (apiSongs.length > 0) return apiSongs;
      } catch {
        /* fall through to the key-less route */
      }
    }

    // Key-less fallback through our own route (parses YouTube's ytInitialData).
    try {
      const videos = await this.searchViaRoute(q);
      if (videos.length > 0) return videos;
    } catch {
      /* fall through to mock */
    }

    return this.mock.searchSongs(query);
  }

  /** Query our key-less /api/youtube/search route for real karaoke videos. */
  private async searchViaRoute(q: string): Promise<Song[]> {
    const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`youtube/search ${res.status}`);
    const data: { videos?: RouteVideo[] } = (await res.json()) as {
      videos?: RouteVideo[];
    };
    const videos = data.videos ?? [];
    return videos.map((v) => ({
      id: `yt-${v.videoId}`,
      videoId: v.videoId,
      title: cleanTitle(v.title),
      artist: splitArtist(v.channel),
      channel: v.channel,
      artwork: v.thumbnail,
      source: "youtube" as const,
      plays: v.views,
      duration: parseDuration(v.duration),
    }));
  }

  private async searchWithApiKey(q: string): Promise<Song[]> {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    // Focus on karaoke videos for karaoke rooms.
    url.searchParams.set("q", `${q} karaoke`);
    url.searchParams.set("maxResults", "12");
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("key", this.apiKey!);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`YouTube API ${res.status}`);
    const data: YouTubeSearchResponse = (await res.json()) as YouTubeSearchResponse;

    return (data.items ?? [])
      .filter((item) => item.id?.videoId && item.snippet?.title)
      .map((item) => {
        const videoId = item.id!.videoId!;
        const title = cleanTitle(item.snippet!.title ?? "Untitled");
        const channel = item.snippet!.channelTitle ?? "";
        return {
          id: `yt-${videoId}`,
          videoId,
          title,
          artist: splitArtist(channel),
          channel,
          artwork: pickThumb(item.snippet),
          source: "youtube" as const,
          plays: undefined,
          year: extractYear(item.snippet!.publishedAt),
        };
      })
      .slice(0, 10);
  }

  async getSong(id: string): Promise<Song | null> {
    if (id.startsWith("yt-")) {
      const videoId = id.replace("yt-", "");
      return {
        id,
        videoId,
        title: "YouTube Song",
        artist: "YouTube",
        source: "youtube",
        artwork: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
    return this.mock.getSong(id);
  }

  async getPopularSongs(): Promise<Song[]> {
    return this.getTopPlayed(8);
  }

  async getTopPlayed(limit = 10): Promise<Song[]> {
    // Load real karaoke videos so the "Top Played" list plays actual videos.
    try {
      const songs = await this.searchViaRoute("popular karaoke songs");
      if (songs.length > 0) {
        return [...songs]
          .sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0))
          .slice(0, limit);
      }
    } catch {
      /* fall through to mock */
    }
    return this.mock.getTopPlayed(limit);
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

function splitArtist(channel: string): string {
  return channel || "Unknown";
}

function pickThumb(
  snippet: YouTubeSearchItem["snippet"],
): string {
  const th = snippet?.thumbnails;
  return th?.high?.url ?? th?.medium?.url ?? th?.default?.url ?? "";
}

function extractYear(publishedAt?: string): number | undefined {
  if (!publishedAt) return undefined;
  const year = new Date(publishedAt).getFullYear();
  return Number.isFinite(year) ? year : undefined;
}

/** Convert a "3:20" or "1:03:20" duration label to seconds. */
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Always use the live YouTube provider so karaoke videos play for real.
// It uses the official API when a key exists, otherwise the key-less
// /api/youtube/search route, and only falls back to the mock catalog if the
// network fails so the UI never breaks.
export const songProvider: SongProvider = new YouTubeSongProvider();
