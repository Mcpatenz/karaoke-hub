import type { Metadata } from "next";
import Landing from "@/components/Landing";
import MobileNav from "@/components/layout/MobileNav";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Mcpatenz Karaoke Hub — Host a Room & Own the Mic",
  description:
    "Mcpatenz Karaoke Hub is a premium karaoke room. Host a session, queue live songs, follow synchronized lyrics, and invite friends to sing together in real time. No account needed.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "karaoke",
    "online karaoke",
    "karaoke room",
    "live karaoke",
    "karaoke songs",
    "synchronized lyrics",
    "sing online",
    "host a karaoke party",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Mcpatenz Karaoke Hub",
    title: "Mcpatenz Karaoke Hub — Sing. Connect. Shine.",
    description:
      "Host a premium karaoke room, queue live songs, and own the mic with synchronized lyrics.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mcpatenz Karaoke Hub — Sing. Connect. Shine.",
    description: "Premium virtual karaoke. Host a room, invite friends, own the mic.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Mcpatenz Karaoke Hub",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Any",
  description:
    "A premium karaoke room to host sessions, queue live songs, follow synchronized lyrics, and sing with friends in real time.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Live karaoke rooms",
    "Real-time song queue",
    "Synchronized lyrics",
    "Host controls",
    "No account required",
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToastProvider>
        <Landing />
        <MobileNav />
      </ToastProvider>
    </>
  );
}