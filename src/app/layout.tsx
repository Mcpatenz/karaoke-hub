import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = "https://karaoke-hub-eight.vercel.app";
const SITE_NAME = "Mcpatenz-KaraokeHub";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#050509",
  colorScheme: "dark",
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Host a Karaoke Room & Own the Mic`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Mcpatenz-KaraokeHub — a premium dark karaoke platform. Host a room, queue live YouTube karaoke videos, follow synchronized lyrics, and invite friends to sing together in real time. No account needed.",
  keywords: [
    "karaoke",
    "karaoke app",
    "online karaoke",
    "karaoke room",
    "live karaoke",
    "karaoke songs",
    "sing online",
    "host a karaoke party",
    "synchronized lyrics",
    "YouTube karaoke",
    "party music",
    "virtual karaoke",
    "karaoke night",
    "free karaoke",
  ],
  authors: [{ name: "Mcpatenz-KaraokeHub" }],
  creator: "Mcpatenz-KaraokeHub",
  publisher: "Mcpatenz-KaraokeHub",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Sing. Connect. Shine.`,
    description:
      "Host a premium karaoke room, queue live YouTube karaoke videos, follow synchronized lyrics, and own the mic with friends.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mcpatenz-KaraokeHub — Sing Together",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Sing. Connect. Shine.`,
    description:
      "Premium virtual karaoke. Host a room, queue live songs, follow lyrics, own the mic.",
    images: ["/og-image.png"],
    creator: "@mcpatenz",
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#050509",
    "msapplication-tap-highlight": "no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} dir="ltr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#050509" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="stage-bg grain min-h-screen bg-surface-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
