import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface YoutubeVideoResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  views?: number;
  duration?: string;
  publishedTime?: string;
}

interface VideoRendererLike {
  videoId?: string;
  title?: { runs?: { text: string }[] };
  ownerText?: { runs?: { text: string }[] };
  channelTitle?: { simpleText?: string };
  thumbnail?: { thumbnails?: { url?: string }[] };
  lengthText?: { simpleText?: string };
  viewCountText?: { simpleText?: string };
  publishedTimeText?: { simpleText?: string };
}

/**
 * Karaoke video search for YouTube.
 *
 * Primary path is the official YouTube Data API v3 (needs YOUTUBE_API_KEY, read
 * here on the server so the key never reaches the browser). Without a key we
 * fall back to parsing YouTube's own search page, which gets blocked from cloud
 * IPs — that is why the key matters.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ videos: [], source: "empty" });

  const apiKey = readApiKey();
  let apiError: string | null = null;

  if (apiKey) {
    // A Data API search costs 100 of the 10,000 units/day, so identical queries
    // are served from the on-disk cache instead of billing every page load.
    const cached = readCache(q);
    if (cached) return NextResponse.json({ videos: cached, source: "api", cached: true });

    try {
      const videos = await searchOnce(q, apiKey);
      writeCache(q, videos);
      return NextResponse.json({ videos, source: "api" });
    } catch (err) {
      // An exhausted quota or a transient failure must not kill search: fall
      // through to the scraper and only surface the API problem if that fails.
      apiError = describeApiError(err);
    }
  }

  let lastStatus = 0;
  let videos: YoutubeVideoResult[] = [];

  // Retry variants use different consent cookies to bypass consent walls that
  // cloud/serverless IPs (e.g. Vercel/AWS) frequently hit.
  const attemptCookies = [
    "CONSENT=YES+1; SOCS=CAI",
    "CONSENT=YES+cb.20240317-11-p0.en+FX+418; SOCS=CAISAiAD",
    "CONSENT=YES+1",
    "",
  ];

  for (const cookie of attemptCookies) {
    try {
      const html = await fetch(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(`${q} karaoke`)}&hl=en&gl=US`,
        {
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "accept-language": "en-US,en;q=0.9",
            accepts:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            ...(cookie ? { cookie } : {}),
          },
          cache: "no-store",
        },
      );
      lastStatus = html.status;
      if (!html.ok) continue;

      const text = await html.text();

      // Detect a consent wall or CAPTCHA page and try the next variant.
      if (
        /consent\.youtube\.com|consent\.google\.com/i.test(text) ||
        /captcha|recaptcha/i.test(text) ||
        text.includes("ytInitialData") === false
      ) {
        continue;
      }

      const data = extractYtInitialData(text);
      videos = data ? extractVideos(data) : [];
      if (videos.length > 0) break;
      continue;
    } catch {
      continue;
    }
  }

  if (videos.length > 0) {
    return NextResponse.json({
      videos,
      source: "scrape",
      warning: apiError ?? undefined,
    });
  }

  // Report the API failure when it is the more useful explanation.
  if (apiError) {
    return NextResponse.json({ videos: [], source: "api", error: apiError }, { status: 502 });
  }

  // Distinguish "we got blocked" from "no results matched".
  if (lastStatus === 0 || lastStatus >= 400) {
    return NextResponse.json(
      {
        videos: [],
        source: "scrape",
        error: "YouTube search is blocked from this server. Add YOUTUBE_API_KEY to .env.local.",
      },
      { status: 502 },
    );
  }
  return NextResponse.json({ videos, source: "scrape" });
}

function readApiKey(): string {
  const raw = process.env.YOUTUBE_API_KEY ?? process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ?? "";
  return raw.trim().replace(/^["']|["']$/g, "");
}

/**
 * Two-tier result cache. YouTube search costs 100 quota units per call and the
 * default project allowance is only 10,000/day, so results are kept for 12 hours
 * on disk (surviving dev-server restarts) as well as in memory.
 */
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_MAX = 300;

type CacheEntry = { at: number; videos: YoutubeVideoResult[] };
const memoryCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<YoutubeVideoResult[]>>();
let diskCache: Record<string, CacheEntry> | null = null;

function cacheFile(): string {
  const dir = process.env.YOUTUBE_CACHE_DIR ?? join(process.cwd(), ".cache");
  return join(dir, "youtube-search.json");
}

function loadDiskCache(): Record<string, CacheEntry> {
  if (diskCache) return diskCache;
  try {
    diskCache = JSON.parse(readFileSync(cacheFile(), "utf8")) as Record<string, CacheEntry>;
  } catch {
    // No cache yet, or the filesystem is read-only (serverless): memory only.
    diskCache = {};
  }
  return diskCache;
}

function readCache(q: string): YoutubeVideoResult[] | undefined {
  const key = q.trim().toLowerCase();
  const hit = memoryCache.get(key) ?? loadDiskCache()[key];
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    memoryCache.delete(key);
    delete loadDiskCache()[key];
    return undefined;
  }
  memoryCache.set(key, hit);
  return hit.videos;
}

function writeCache(q: string, videos: YoutubeVideoResult[]): void {
  const key = q.trim().toLowerCase();
  const entry: CacheEntry = { at: Date.now(), videos };
  memoryCache.set(key, entry);

  const store = loadDiskCache();
  store[key] = entry;
  const keys = Object.keys(store);
  if (keys.length > CACHE_MAX) {
    const stale = keys
      .sort((a, b) => store[a].at - store[b].at)
      .slice(0, keys.length - CACHE_MAX);
    for (const k of stale) delete store[k];
  }

  try {
    mkdirSync(dirname(cacheFile()), { recursive: true });
    writeFileSync(cacheFile(), JSON.stringify(store));
  } catch {
    try {
      const fallback = join(tmpdir(), "karaoke-hub-youtube-search.json");
      writeFileSync(fallback, JSON.stringify(store));
    } catch {
      /* memory cache still serves this process */
    }
  }
}

/** Collapses simultaneous identical queries into one billed API call. */
function searchOnce(q: string, apiKey: string): Promise<YoutubeVideoResult[]> {
  const key = q.trim().toLowerCase();
  const running = inFlight.get(key);
  if (running) return running;
  const pending = searchWithApi(q, apiKey).finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}

/** The Data API returns HTML-escaped titles ("It&#39;s", "&amp;"). */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/**
 * Official Data API v3 search. A search call costs 100 quota units, so this is
 * the only API request per query — durations are filled in afterwards by a
 * single batched videos.list call (1 unit) instead of per-result lookups.
 */
async function searchWithApi(q: string, apiKey: string): Promise<YoutubeVideoResult[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", `${q} karaoke`);
  url.searchParams.set("maxResults", "25");
  url.searchParams.set("relevanceLanguage", "en");
  // Only return videos that can actually play inside our embedded player,
  // otherwise YouTube reports "Video unavailable" on the stage.
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("videoSyndicated", "true");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body);
  }

  const data = (await res.json()) as {
    items?: {
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: { default?: { url?: string }; medium?: { url?: string }; high?: { url?: string } };
      };
    }[];
  };

  const videos: YoutubeVideoResult[] = [];
  for (const item of data.items ?? []) {
    const videoId = item.id?.videoId;
    const title = item.snippet?.title;
    if (!videoId || !title) continue;
    const th = item.snippet?.thumbnails;
    videos.push({
      videoId,
      title: decodeHtmlEntities(title),
      channel: decodeHtmlEntities(item.snippet?.channelTitle ?? ""),
      thumbnail: th?.high?.url ?? th?.medium?.url ?? th?.default?.url ?? "",
      publishedTime: item.snippet?.publishedAt,
    });
    if (videos.length >= 20) break;
  }

  await attachDurations(videos, apiKey);
  return videos;
}

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`YouTube API ${status}`);
  }
}

function describeApiError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "Could not reach the YouTube API. Check your internet connection.";
  }
  let reason = "";
  try {
    const parsed = JSON.parse(err.body) as { error?: { message?: string } };
    reason = parsed.error?.message ?? "";
  } catch {
    reason = err.body.slice(0, 160);
  }
  if (err.status === 400 || /API key not valid/i.test(reason)) {
    return `YouTube rejected the API key. Check YOUTUBE_API_KEY in .env.local. ${reason}`.trim();
  }
  if (err.status === 403 || /quota/i.test(reason)) {
    return `YouTube API quota exhausted or key restricted. ${reason}`.trim();
  }
  return `YouTube API error ${err.status}. ${reason}`.trim();
}

/** One batched videos.list call (1 quota unit) fills in real durations. */
async function attachDurations(videos: YoutubeVideoResult[], apiKey: string): Promise<void> {
  if (videos.length === 0) return;
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "contentDetails,statistics");
    url.searchParams.set("id", videos.map((v) => v.videoId).join(","));
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      items?: {
        id?: string;
        contentDetails?: { duration?: string };
        statistics?: { viewCount?: string };
      }[];
    };

    const byId = new Map<string, { duration?: string; views?: number }>();
    for (const item of data.items ?? []) {
      if (!item.id) continue;
      const seconds = isoToSeconds(item.contentDetails?.duration);
      const views = Number(item.statistics?.viewCount);
      byId.set(item.id, {
        duration: seconds ? `${seconds}` : undefined,
        views: Number.isFinite(views) ? views : undefined,
      });
    }

    for (const video of videos) {
      const extra = byId.get(video.videoId);
      if (!extra) continue;
      if (extra.duration) video.duration = extra.duration;
      if (extra.views) video.views = extra.views;
    }
  } catch {
    /* durations are a nice-to-have, search results still work without them */
  }
}

function isoToSeconds(iso?: string): number | undefined {
  if (!iso) return undefined;
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return undefined;
  const [, d, h, min, s] = m.map((x) => (x ? Number(x) : 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

/** Pull the `var ytInitialData = {...};` object using a small brace matcher. */
function extractYtInitialData(html: string): unknown | null {
  const marker = "var ytInitialData";
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  const start = html.indexOf("{", idx);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1)) as unknown;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function extractVideos(data: unknown): YoutubeVideoResult[] {
  const root = data as {
    contents?: {
      twoColumnSearchResultsRenderer?: {
        primaryContents?: {
          sectionListRenderer?: {
            contents?: {
              itemSectionRenderer?: { contents?: { videoRenderer?: VideoRendererLike }[] };
              shelfRenderer?: {
                content?: {
                  horizontalListRenderer?: {
                    items?: { videoRenderer?: VideoRendererLike }[];
                  };
                };
              };
            }[];
          };
        };
      };
    };
  };

  const sections =
    root?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
      ?.contents ?? [];

  const seen = new Set<string>();
  const videos: YoutubeVideoResult[] = [];

  for (const section of sections) {
    const itemContents =
      section?.itemSectionRenderer?.contents ??
      section?.shelfRenderer?.content?.horizontalListRenderer?.items ??
      [];
    for (const item of itemContents) {
      const vr = item?.videoRenderer;
      if (!vr?.videoId) continue;
      if (seen.has(vr.videoId)) continue;
      seen.add(vr.videoId);

      const title = vr.title?.runs?.map((r) => r.text).join("").trim();
      if (!title) continue;

      const channel =
        vr.ownerText?.runs?.map((r) => r.text).join("").trim() ||
        vr.channelTitle?.simpleText ||
        "";
      const thumb =
        vr.thumbnail?.thumbnails?.slice(-1)[0]?.url ?? "";
      const duration = vr.lengthText?.simpleText ?? undefined;
      const publishedTime = vr.publishedTimeText?.simpleText ?? undefined;
      const views = parseViews(vr.viewCountText?.simpleText);

      videos.push({
        videoId: vr.videoId,
        title: decodeHtmlEntities(title),
        channel: decodeHtmlEntities(channel),
        thumbnail: thumb,
        views,
        duration,
        publishedTime,
      });
    }
  }

  return videos.slice(0, 15);
}

function parseViews(text?: string): number | undefined {
  if (!text) return undefined;
  const digits = text.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
}