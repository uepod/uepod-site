const Parser = require("rss-parser");
const episodeOverrides = require("./episodeOverrides");

const RSS_URL = "https://anchor.fm/s/10a3f3bac/podcast/rss";

/**
 * Convert an RSS title to a slug key for matching overrides.
 * E.g. "[Lottie's Meats] Chelsey & Cassie Maschhoff" â†’ "lotties-meats-chelsey-cassie-maschhoff"
 */
function titleToSlug(title) {
  return title
    .replace(/[\[\]]/g, "")
    .replace(/['']/g, "")
    .replace(/&/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/**
 * Extract brand name from RSS title.
 * Handles formats like "[Brand] Guest Name" or just "Guest Name"
 */
function extractBrand(title) {
  const match = title.match(/^\[(.+?)\]\s*(.+)$/);
  if (match) return { brand: match[1], guest: match[2] };
  return { brand: title, guest: title };
}

/**
 * Try to extract Spotify episode URL from RSS item's enclosure or link.
 * Spotify for Creators (formerly Anchor) RSS feeds include episode-specific links.
 */
function extractSpotifyUrl(item) {
  // Check for Spotify link in the item
  if (item.link && item.link.includes("spotify.com/episode")) {
    return item.link;
  }
  // Check enclosure
  if (item.enclosure && item.enclosure.url && item.enclosure.url.includes("spotify")) {
    return item.enclosure.url;
  }
  // Fallback: show page
  return "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F";
}

/**
 * Extract Apple Podcasts episode URL.
 * We construct it from the show ID + episode guid if possible.
 */
function extractAppleUrl(item) {
  // Apple Podcasts links are not typically in RSS from Anchor.
  // Fallback to the show page; the override file can specify per-episode.
  return "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735";
}

/**
 * Format duration from seconds or HH:MM:SS to "XX min"
 */
function formatDuration(dur) {
  if (!dur) return "";
  // If it's already a string like "00:48:30"
  if (typeof dur === "string" && dur.includes(":")) {
    const parts = dur.split(":").map(Number);
    if (parts.length === 3) return `${parts[0] * 60 + parts[1]} min`;
    if (parts.length === 2) return `${parts[0]} min`;
  }
  // If it's seconds
  const secs = parseInt(dur, 10);
  if (!isNaN(secs)) return `${Math.round(secs / 60)} min`;
  return dur;
}

/**
 * Format date from RSS pubDate to "Mon DD, YYYY"
 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Truncate RSS description to 1-2 sentences for fallback.
 */
function truncateDesc(html) {
  if (!html) return "";
  // Strip HTML tags
  const text = html.replace(/<[^>]+>/g, "").trim();
  // Take first 2 sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 0) {
    return sentences.slice(0, 2).join(" ").trim();
  }
  // Fallback: first 200 chars
  return text.slice(0, 200).trim() + (text.length > 200 ? "..." : "");
}

/**
 * Fetch and process all episodes from the RSS feed.
 * Merges with overrides file for custom descriptions and category tags.
 */
async function fetchEpisodes() {
  const parser = new Parser({
    customFields: {
      item: [
        ["itunes:duration", "duration"],
        ["itunes:episode", "episodeNumber"],
        ["itunes:image", "itunesImage"],
      ],
    },
  });

  let feed;
  try {
    feed = await parser.parseURL(RSS_URL);
  } catch (err) {
    console.error("Failed to fetch RSS feed:", err.message);
    return [];
  }

  const episodes = feed.items
    .map((item, index) => {
      const slug = titleToSlug(item.title || "");
      const override = findOverride(slug, item.title);
      const { brand: rssBrand, guest: rssGuest } = extractBrand(item.title || "");

      const spotifyUrl = extractSpotifyUrl(item);
      const appleUrl = extractAppleUrl(item);
      const youtubeUrl = "https://www.youtube.com/@TheUnitEconomicsPodcast";

      return {
        id: feed.items.length - index,
        title: item.title || "",
        brand: override?.brand || rssBrand,
        guest: override?.guest || rssGuest,
        desc: override?.desc || truncateDesc(item.contentSnippet || item.content || ""),
        category: override?.category || "Uncategorized",
        duration: formatDuration(item.duration || item.itunes?.duration),
        date: formatDate(item.pubDate),
        rawDate: item.pubDate,
        spotify: spotifyUrl,
        apple: appleUrl,
        youtube: youtubeUrl,
        website: override?.website || null,
        image: item.itunesImage?.href || item.itunes?.image || null,
      };
    })
    .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  return episodes;
}

/**
 * Find the best matching override for an episode.
 * Tries exact slug match first, then partial matching.
 */
function findOverride(slug, title) {
  // Exact match
  if (episodeOverrides[slug]) return episodeOverrides[slug];

  // Try partial match on brand name
  const titleLower = (title || "").toLowerCase();
  for (const [key, val] of Object.entries(episodeOverrides)) {
    const brandLower = (val.brand || "").toLowerCase();
    if (brandLower && titleLower.includes(brandLower)) {
      return val;
    }
  }

  // Try matching override key parts against the slug
  for (const [key, val] of Object.entries(episodeOverrides)) {
    const keyParts = key.split("-").filter(p => p.length > 3);
    const matchCount = keyParts.filter(p => slug.includes(p)).length;
    if (matchCount >= 2) return val;
  }

  return null;
}

module.exports = { fetchEpisodes, titleToSlug };
