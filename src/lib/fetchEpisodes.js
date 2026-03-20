const Parser = require("rss-parser");
const episodeOverrides = require("./episodeOverrides");
const { fetchSheetData } = require("./fetchSheetData");

const RSS_URL = "https://anchor.fm/s/10a3f3bac/podcast/rss";

// Fallback URLs when no per-episode link is available
const SPOTIFY_SHOW = "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F";
const APPLE_SHOW = "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735";
const YOUTUBE_CHANNEL = "https://www.youtube.com/@TheUnitEconomicsPodcast";

/**
 * Convert an RSS title to a slug key for matching overrides.
 */
function titleToSlug(title) {
  return title
    .replace(/[\[\]]/g, "")
    .replace(/[\u2018\u2019]/g, "")
    .replace(/&/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/**
 * Extract brand name from RSS title.
 */
function extractBrand(title) {
  const match = title.match(/^\[(.+?)\]\s*(.+)$/);
  if (match) return { brand: match[1], guest: match[2] };
  return { brand: title, guest: title };
}

/**
 * Format duration from seconds or HH:MM:SS to "XX min"
 */
function formatDuration(dur) {
  if (!dur) return "";
  if (typeof dur === "string" && dur.includes(":")) {
    const parts = dur.split(":").map(Number);
    if (parts.length === 3) return `${parts[0] * 60 + parts[1]} min`;
    if (parts.length === 2) return `${parts[0]} min`;
  }
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
  const text = html.replace(/<[^>]+>/g, "").trim();
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 0) {
    return sentences.slice(0, 2).join(" ").trim();
  }
  return text.slice(0, 200).trim() + (text.length > 200 ? "..." : "");
}

/**
 * Find the best matching override for an episode.
 * Sheet data is primary, JS overrides file is fallback.
 */
function findOverride(slug, title, sheetData) {
  // 1. Exact slug match in sheet
  if (sheetData[slug]) return sheetData[slug];

  // 2. Exact slug match in JS overrides
  if (episodeOverrides[slug]) return episodeOverrides[slug];

  // 3. Partial brand match in sheet
  const titleLower = (title || "").toLowerCase();
  for (const [key, val] of Object.entries(sheetData)) {
    const brandLower = (val.brand || "").toLowerCase();
    if (brandLower && titleLower.includes(brandLower)) return val;
  }

  // 4. Partial brand match in JS overrides
  for (const [key, val] of Object.entries(episodeOverrides)) {
    const brandLower = (val.brand || "").toLowerCase();
    if (brandLower && titleLower.includes(brandLower)) return val;
  }

  // 5. Fuzzy key-part match in JS overrides
  for (const [key, val] of Object.entries(episodeOverrides)) {
    const keyParts = key.split("-").filter((p) => p.length > 3);
    const matchCount = keyParts.filter((p) => slug.includes(p)).length;
    if (matchCount >= 2) return val;
  }

  return null;
}

/**
 * Fetch and process all episodes from the RSS feed.
 * Merges with Google Sheet (primary) and JS overrides (fallback).
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

  // Fetch sheet data and RSS in parallel
  const [sheetData, feed] = await Promise.all([
    fetchSheetData(),
    parser.parseURL(RSS_URL).catch((err) => {
      console.error("Failed to fetch RSS feed:", err.message);
      return null;
    }),
  ]);

  if (!feed) return [];

  const episodes = feed.items
    .map((item, index) => {
      const slug = titleToSlug(item.title || "");
      const override = findOverride(slug, item.title, sheetData);
      const { brand: rssBrand, guest: rssGuest } = extractBrand(
        item.title || ""
      );

      return {
        id: feed.items.length - index,
        title: item.title || "",
        slug,
        brand: override?.brand || rssBrand,
        guest: override?.guest || rssGuest,
        desc:
          override?.desc ||
          truncateDesc(item.contentSnippet || item.content || ""),
        category: override?.category || "Uncategorized",
        duration: formatDuration(item.duration || item.itunes?.duration),
        date: formatDate(item.pubDate),
        rawDate: item.pubDate,
        spotify: override?.spotify || SPOTIFY_SHOW,
        apple: override?.apple || APPLE_SHOW,
        youtube: override?.youtube || YOUTUBE_CHANNEL,
        website: override?.website || null,
        image: item.itunesImage?.href || item.itunes?.image || null,
      };
    })
    .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  return episodes;
}

module.exports = { fetchEpisodes, titleToSlug };
