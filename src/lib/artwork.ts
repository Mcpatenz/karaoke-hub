const PALETTES = [
  { a: "#ff7800", b: "#4a2200" },
  { a: "#f43f5e", b: "#3b0a18" },
  { a: "#22c55e", b: "#0a3b18" },
  { a: "#0ea5e9", b: "#06293b" },
  { a: "#8b5cf6", b: "#2a1259" },
  { a: "#eab308", b: "#4a3800" },
  { a: "#ec4899", b: "#3b0a2a" },
  { a: "#14b8a6", b: "#053b34" },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Deterministic local album artwork as an inline SVG data URI.
 * Never depends on the network, so it can never 404.
 */
export function mockArtwork(title: string): string {
  const p = PALETTES[hash(title) % PALETTES.length];
  const initial = (title.charAt(0) || "♪").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.a}"/>
      <stop offset="1" stop-color="${p.b}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="url(#g)"/>
  <circle cx="250" cy="70" r="120" fill="#ffffff" opacity="0.07"/>
  <circle cx="60" cy="280" r="140" fill="#000000" opacity="0.18"/>
  <circle cx="160" cy="160" r="72" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="central" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="140" fill="#ffffff" opacity="0.92">${initial}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}