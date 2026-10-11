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

## Episode pages

Every episode has a page at `/episodes/<slug>`. The slug is the same one the sheet and the RSS title already share (`titleToSlug` in `src/lib/fetchEpisodes.js`).

Pages are generated from the RSS feed joined with the Episode Metadata sheet. No separate list of episodes is maintained in the repo.

- At build, known slugs are prerendered.
- `fallback: "blocking"` renders a slug that was not in that build as soon as the feed or the sheet has it.
- Each page sets `revalidate: 900`, so a request serves the cached page and regenerates it in the background at most every 15 minutes.
- A slug that is in neither source returns a 404. That 404 is cached for the same 15 minutes, then checked again.
- The Vercel cron (`vercel.json`) calls `/api/revalidate` twice a day. That route revalidates `/` and every `/episodes/<slug>`.

A new RSS item is enough for a page. Sheet fields (description, guest, links, category, website) fill in on the next regeneration once the row’s `slug` matches. A sheet row with no RSS item yet still gets a page, using only the cells that are filled in.

Episode artwork from the RSS `itunes:image` (or the show artwork if the item has none) is the Open Graph image, the Twitter card image, and the `PodcastEpisode` JSON-LD `image`. It is not shown on the page.

The Listen section is a Spotify / Apple Podcasts / YouTube tab switcher built from the episode links in the sheet. Spotify uses the dark embed theme. Only the selected player is loaded, and it loads lazily. A missing episode link omits that tab. There is no second row of outbound buttons. Substack stays in the site footer.

## Key takeaways

The episode page renders a **Key takeaways** section only when that episode has takeaway text. Nothing is filled in by default.

Add an optional `takeaways` column to the Episode Metadata sheet. In the cell, separate each item with a pipe (or a line break):

```
Drops matched production to demand | A commercial kitchen changes the cost structure
```

Leave the cell blank, or omit the column, and the section stays hidden. The site picks the column up on the next regeneration (within 15 minutes of a visit, or at the next cron). No code change.

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
