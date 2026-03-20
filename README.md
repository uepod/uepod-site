# Unit Economics — uepod.com

Podcast website for Unit Economics, hosted by Josh Stabinsky.

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to vercel.com and sign in with GitHub
3. Click "New Project" → import this repo
4. Vercel auto-detects Vite — just click "Deploy"
5. You'll get a live URL like `uepod.vercel.app` in ~30 seconds

## Connect uepod.com

1. In Vercel dashboard → your project → Settings → Domains
2. Add `uepod.com` and `www.uepod.com`
3. Vercel will show you DNS records to add
4. Go to Squarespace → Domains → uepod.com → DNS Settings
5. Add a CNAME record: `www` → `cname.vercel-dns.com`
6. For the root domain, add an A record pointing to `76.76.21.21`
7. Wait for DNS propagation (usually 5-30 minutes)
8. Once verified, cancel your Squarespace website subscription (keep domain registration)

## Adding New Episodes

Edit `src/App.jsx` and add a new entry to the top of the `EPISODES` array:

```js
{ id: 30, brand: "Brand Name", guest: "Guest Name", desc: "Description following the format rule: framing clause first, then operational topics.", duration: "45 min", date: "Mar 24, 2026", category: "Category", spotify: "https://...", apple: "https://...", youtube: "https://..." },
```

Push to GitHub and Vercel auto-deploys.

## Before Going Live

- [ ] Replace the SVG logo in the nav with your actual PNG (`/public/logo-white.png`)
- [ ] Add your photo to the About page
- [ ] Add a favicon (`/public/favicon.png`)
- [ ] Verify all episode dates against Spotify
- [ ] Add `website: "https://..."` fields to episodes where applicable
- [ ] Add `color: "#hex"` fields for brand-colored hover on episode titles
- [ ] Add cover art support (add `img` field to episodes, update EpisodeCard component)

## Fonts

- **Anton** — headers, episode brand names, logo
- **Space Grotesk** — nav, body text, descriptions, buttons
- **JetBrains Mono** — episode numbers, dates, durations, copyright

## Tech Stack

- React 18
- Vite
- Hosted on Vercel (free tier)
- Domain at Squarespace
