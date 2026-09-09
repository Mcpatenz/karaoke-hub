import { NextResponse } from "next/server";

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
 * Key-less karaoke video search over YouTube.
 *
 * Fetches YouTube's search results page and parses the embedded `ytInitialData`
 * JSON for video items. Used only as a fallback when no YouTube API key is set;
 * the UI still works if this is ever blocked.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ videos: [] });

  try {
    const html = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(`${q} karaoke`)}`,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          "accept-language": "en-US,en;q=0.9",
          cookie: "CONSENT=YES+1; SOCS=CAI",
        },
        cache: "no-store",
      },
    );
    if (!html.ok) {
      return NextResponse.json({ videos: [] }, { status: html.status });
    }
    const text = await html.text();
    const data = extractYtInitialData(text);
    const videos = data ? extractVideos(data) : [];

    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ videos: [] }, { status: 502 });
  }
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

      videos.push({ videoId: vr.videoId, title, channel, thumbnail: thumb, views, duration, publishedTime });
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