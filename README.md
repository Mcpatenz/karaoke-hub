# Karaoke Hub 🎤

A premium, animated karaoke entertainment landing website built with **React 19**, **Vite 8**, **Tailwind CSS v4**, and **Framer Motion**.

## ✨ Features

- **Cinematic scroll** — parallax hero, animated gradient orbs & rotating rings
- **Interactive & responsive** — mobile menu, hover effects, live interactive song search/filter
- **Motion & animation** — scroll reveal, staggered entrances, floating elements, marquee ticker, progress rings
- **SEO optimized** — meta tags, Open Graph, Twitter cards, semantic HTML
- **Modern SaaS-premium aesthetic** — dark theme, glassmorphism, gradient accents, film-grain overlay

## 🧩 Sections

1. **Hero** — cinematic landing with floating feature cards, animated CTA, live stats
2. **Marquee** — scrolling song ticker
3. **Features** — bento-grid with hover glow
4. **Song Library** — interactive search + genre filter + favorites
5. **Venue Finder** — filterable venue cards
6. **Live Community** — interactive chat + virtual gifts demo
7. **Badges & Rewards** — achievement badges + live leaderboard
8. **CTA** — animated call-to-action panel
9. **Footer** — full site navigation

## 🚀 Getting Started

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

## 🛠 Tech Stack

- **React 19** + TypeScript
- **Vite 8** build tool
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Framer Motion** for animations
- **Lucide React** icons

## 📂 Project Structure

```
src/
├── App.tsx                  # Composes all sections
├── main.tsx                 # App entry
├── index.css                # Tailwind + design tokens + keyframes
└── components/
    ├── Navbar.tsx           # Scroll-aware sticky nav + mobile menu
    ├── Hero.tsx             # Cinematic hero
    ├── Marquee.tsx          # Song ticker
    ├── Features.tsx         # Feature grid
    ├── SongLibrary.tsx      # Interactive song search/filter
    ├── Venues.tsx           # Filterable venues
    ├── Community.tsx        # Live chat + gifts
    ├── Rewards.tsx          # Badges + leaderboard
    ├── CTA.tsx              # Call-to-action
    ├── Footer.tsx           # Site footer
    ├── SEO.tsx              # Dynamic meta tags
    └── primitives.tsx       # Shared animation primitives
```
