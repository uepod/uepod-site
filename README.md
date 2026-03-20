# Unit Economics Podcast — uepod.com

Next.js site for the Unit Economics podcast. Episodes are fetched from the RSS feed at build time, with custom descriptions and category tags applied from `src/lib/episodeOverrides.js`.

## Setup

```bash
npm install
bash scripts/download-fonts.sh   # Download self-hosted .woff2 fonts
npm run dev                       # Start dev server at localhost:3000
```

## How episodes work

1. At build time, `getStaticProps` calls `fetchEpisodes()` which fetches the Anchor/Spotify RSS feed
2. Each RSS episode is matched against `src/lib/episodeOverrides.js` by slug
3. If an override exists, its `desc`, `category`, `brand`, and `guest` take priority over RSS data
4. If no override exists, the RSS description is truncated to 1-2 sentences as fallback

## Adding a new episode override

Add a new entry to `src/lib/episodeOverrides.js`:

```js
"brand-slug-guest-name": {
  brand: "Brand Name",
  guest: "Guest Name",
  category: "Category",
  desc: "One to two sentence description following the pattern: [What the company does]: [key topics covered].",
}
```

## Automatic rebuilds

A Vercel cron job (`vercel.json`) triggers `/api/revalidate` daily at 10:00 UTC. This rebuilds the site with fresh RSS data, so new episodes appear automatically after publishing to Spotify for Creators.

You can also trigger a manual rebuild:
```
GET https://uepod.com/api/revalidate?secret=YOUR_SECRET
```

## Fonts

Self-hosted in `public/fonts/`. Above-the-fold fonts are preloaded in `_document.js`. No Google Fonts @import.

- **Anton 400** — Headers, episode brand names
- **Space Grotesk 300/400/500/600/700** — Body, descriptions, buttons
- **JetBrains Mono 300/400** — Nav links, episode numbers, dates, copyright

## Deploy

Push to `main` branch → Vercel auto-deploys.
