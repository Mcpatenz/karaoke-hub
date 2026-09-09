import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#050509",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mcpatenz Karaoke Hub — The ultimate party command center",
  description:
    "Mcpatenz Karaoke Hub — a premium dark karaoke platform. Host a room, invite friends, and own the mic.",
  keywords: [
    "karaoke",
    "karaoke songs",
    "live karaoke",
    "sing online",
    "karaoke app",
    "party command center",
  ],
  authors: [{ name: "Mcpatenz Karaoke Hub" }],
  openGraph: {
    type: "website",
    title: "Mcpatenz Karaoke Hub — Sing. Connect. Shine.",
    description:
      "Host a room, invite friends, and own the mic. Premium virtual karaoke experience.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="stage-bg grain min-h-screen bg-surface-base text-text-primary">
        {children}
      </body>
    </html>
  );
}
