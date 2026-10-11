const fs = require("fs");
const os = require("os");
const path = require("path");
const Parser = require("rss-parser");
const episodeOverrides = require("./episodeOverrides");
const { fetchSheetData } = require("./fetchSheetData");
const {
  parseTakeaways,
  resolveEpisodeImage,
  asImageUrl,
  htmlToParagraphs,
  toIsoDuration,
} = require("./episodePage");

const RSS_URL = "https://anchor.fm/s/10a3f3bac/podcast/rss";

// Fallback URLs when no per-episode link is available
const SPOTIFY_SHOW = "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F";
const APPLE_SHOW = "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735";
const YOUTUBE_CHANNEL = "https://www.youtube.com/@TheUnitEconomicsPodcast";

const CACHE_PATH = path.join(os.tmpdir(), "uepod-episodes-v1.json");
const LOCK_PATH = `${CACHE_PATH}.lock`;
const CACHE_MS = 60 * 1000;

let memoryCache = null;
let inflight = null;

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

function audioFromItem(item) {
  const enclosure = item?.enclosure;
  const type = (enclosure?.type || "").toLowerCase();
  if (!enclosure?.url || (type && !type.startsWith("audio/"))) {
    return { audioUrl: null, audioType: null };
  }
  return {
    audioUrl: enclosure.url,
    audioType: enclosure.type || "audio/mpeg",
  };
}

/**
 * Homepage shape. Extra page-only fields stay off this object so the
 * existing list payload does not grow.
 */
function toPublicEpisode(episode) {
  return {
    id: episode.id,
    title: episode.title,
    slug: episode.slug,
    brand: episode.brand,
    guest: episode.guest,
    desc: episode.desc,
    category: episode.category,
    duration: episode.duration,
    date: episode.date,
    rawDate: episode.rawDate,
    spotify: episode.spotify,
    apple: episode.apple,
    youtube: episode.youtube,
    website: episode.website,
    image: episode.image,
  };
}

function sheetOnlyEpisode(slug, row) {
  return {
    id: null,
    title: row.title || row.brand || slug,
    slug,
    brand: row.brand || row.title || slug,
    guest: row.guest || "",
    desc: row.desc || "",
    category: row.category || "",
    duration: "",
    durationIso: null,
    date: "",
    rawDate: null,
    isoDate: null,
    spotify: row.spotify || null,
    apple: row.apple || null,
    youtube: row.youtube || null,
    website: row.website || null,
    image: null,
    published: false,
    audioUrl: null,
    audioType: null,
    descriptionParagraphs: [],
    takeaways: parseTakeaways(row.takeaways),
  };
}

function readDiskCache() {
  if (process.env.NODE_ENV !== "production") return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
    if (!parsed || !Array.isArray(parsed.episodes) || !parsed.episodes.length) {
      return null;
    }
    if (Date.now() - parsed.at > CACHE_MS) return null;
    return parsed.episodes;
  } catch {
    return null;
  }
}

function writeDiskCache(episodes) {
  if (process.env.NODE_ENV !== "production") return;
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify({ at: Date.now(), episodes }));
  } catch (err) {
    console.error("Episode cache write failed:", err.message);
  }
}

function remember(episodes) {
  memoryCache = { at: Date.now(), episodes };
  writeDiskCache(episodes);
}

function readFresh() {
  if (memoryCache && Date.now() - memoryCache.at < CACHE_MS && memoryCache.episodes?.length) {
    return memoryCache.episodes;
  }
  const disk = readDiskCache();
  if (disk) {
    memoryCache = { at: Date.now(), episodes: disk };
    return disk;
  }
  return null;
}

function tryLock() {
  try {
    const stat = fs.statSync(LOCK_PATH);
    if (Date.now() - stat.mtimeMs > 30000) fs.unlinkSync(LOCK_PATH);
  } catch {
    // no lock yet
  }
  try {
    fs.writeFileSync(LOCK_PATH, String(process.pid), { flag: "wx" });
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * RSS episodes merged with the sheet, plus sheet rows that do not have an
 * RSS item yet. Published episodes keep the same fields the homepage uses.
 */
async function actuallyLoad() {
  const parser = new Parser({
    customFields: {
      item: [
        ["itunes:duration", "duration"],
        ["itunes:episode", "episodeNumber"],
        ["itunes:image", "itunesImage"],
      ],
    },
  });

  const [sheetData, feed] = await Promise.all([
    fetchSheetData(),
    parser.parseURL(RSS_URL).catch((err) => {
      console.error("Failed to fetch RSS feed:", err.message);
      return null;
    }),
  ]);

  if (!feed) {
    throw new Error("RSS fetch failed");
  }

  const showImage = asImageUrl(feed.itunes?.image) || asImageUrl(feed.image) || null;

  const rssEpisodes = feed.items
    .map((item, index) => {
      const slug = titleToSlug(item.title || "");
      const override = findOverride(slug, item.title, sheetData);
      const { brand: rssBrand, guest: rssGuest } = extractBrand(item.title || "");
      const rawDuration = item.duration || item.itunes?.duration || "";
      const { audioUrl, audioType } = audioFromItem(item);

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
        duration: formatDuration(rawDuration),
        durationIso: toIsoDuration(rawDuration),
        date: formatDate(item.pubDate),
        rawDate: item.pubDate,
        isoDate: item.isoDate || null,
        spotify: override?.spotify || SPOTIFY_SHOW,
        apple: override?.apple || APPLE_SHOW,
        youtube: override?.youtube || YOUTUBE_CHANNEL,
        website: override?.website || null,
        image: resolveEpisodeImage(item, showImage),
        published: true,
        audioUrl,
        audioType,
        descriptionParagraphs: htmlToParagraphs(
          item.content || item.contentSnippet || ""
        ),
        takeaways: parseTakeaways(override?.takeaways),
      };
    })
    .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  const seen = new Set();
  const published = [];
  for (const episode of rssEpisodes) {
    if (!episode.slug || seen.has(episode.slug)) continue;
    seen.add(episode.slug);
    published.push(episode);
  }

  const drafts = Object.entries(sheetData)
    .filter(([slug]) => slug && !seen.has(slug))
    .map(([slug, row]) => sheetOnlyEpisode(slug, row));

  return published.concat(drafts);
}

async function loadDetailed() {
  const fresh = readFresh();
  if (fresh) return fresh;

  if (process.env.NODE_ENV !== "production") {
    if (!inflight) {
      inflight = actuallyLoad().finally(() => {
        inflight = null;
      });
    }
    return inflight;
  }

  const started = Date.now();
  let ownLock = false;
  while (!ownLock && Date.now() - started < 25000) {
    const cached = readFresh();
    if (cached) return cached;
    ownLock = tryLock();
    if (!ownLock) await sleep(200);
  }

  try {
    const cached = readFresh();
    if (cached) return cached;
    const episodes = await actuallyLoad();
    if (episodes.length) remember(episodes);
    return episodes;
  } finally {
    if (ownLock) {
      try {
        fs.unlinkSync(LOCK_PATH);
      } catch {
        // another worker already cleared it
      }
    }
  }
}

/**
 * Fetch and process all episodes from the RSS feed.
 * Merges with Google Sheet (primary) and JS overrides (fallback).
 */
async function fetchEpisodes() {
  try {
    const episodes = await loadDetailed();
    return episodes.filter((episode) => episode.published).map(toPublicEpisode);
  } catch (err) {
    console.error("Failed to fetch episodes:", err.message);
    return [];
  }
}

/**
 * Every episode page: published RSS episodes, plus sheet rows that are not
 * in the feed yet. A new row or a new RSS item shows up on the next
 * regeneration without a code change.
 */
async function fetchEpisodeDirectory() {
  return loadDetailed();
}

module.exports = { fetchEpisodes, fetchEpisodeDirectory, titleToSlug };
