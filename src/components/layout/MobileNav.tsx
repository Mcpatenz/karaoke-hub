"use client";

import Link from "next/link";
import { Mic, ListMusic, Heart, User, Home } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: ListMusic },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
];

export default function MobileNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-default bg-surface-base/95 backdrop-blur-md safe-area-bottom lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-text-tertiary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-medium leading-none">{label}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/room"
            aria-label="Open karaoke room"
            className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-accent transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Mic className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium leading-none">Sing</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
