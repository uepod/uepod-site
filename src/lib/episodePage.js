/**
 * Pure helpers for episode pages. No network, no invented copy.
 * Takeaways, players, related episodes, and structured data all come from
 * fields that already exist on an episode record.
 */

const SITE_URL = "https://uepod.com";
const SUBSTACK_URL = "https://uepod.substack.com/";
const FALLBACK_SHARE_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Optional `takeaways` cell from the Episode Metadata sheet.
 * Items are separated by a pipe or a newline. Empty stays empty.
 */
function parseTakeaways(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(/\s*\|\s*|\r?\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function asImageUrl(value) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value.href === "string") return value.href.trim();
  if (value.$ && typeof value.$.href === "string") return value.$.href.trim();
  return "";
}

/**
 * Per-episode itunes:image, then the show artwork.
 */
function resolveEpisodeImage(item, showImage) {
  const fromItem =
    asImageUrl(item?.itunesImage) || asImageUrl(item?.itunes?.image);
  return fromItem || asImageUrl(showImage) || null;
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#8217;|&rsquo;|&apos;/g, "'")
    .replace(/&#8216;|&lsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;|&#8212;/g, "—")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&hellip;|&#8230;/g, "…")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    });
}

/**
 * RSS show notes are short HTML. Flatten to plain paragraphs so the page
 * can render them without injecting markup.
 */
function htmlToParagraphs(html) {
  if (!html || typeof html !== "string") return [];
  const withBreaks = html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n\n")
    .replace(/<\/\s*h[1-6]\s*>/gi, "\n\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\/\s*li\s*>/gi, "\n");
  const text = decodeEntities(withBreaks.replace(/<[^>]+>/g, ""));
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim())
    .filter(Boolean);
}

/**
 * itunes duration ("HH:MM:SS" or seconds) to ISO 8601 for JSON-LD.
 */
function toIsoDuration(dur) {
  if (dur === null || dur === undefined || dur === "") return null;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (typeof dur === "string" && dur.includes(":")) {
    const parts = dur.split(":").map((part) => Number(part));
    if (parts.some((n) => !Number.isFinite(n))) return null;
    if (parts.length === 3) {
      [hours, minutes, seconds] = parts;
    } else if (parts.length === 2) {
      [minutes, seconds] = parts;
    } else {
      return null;
    }
  } else {
    const total = parseInt(dur, 10);
    if (!Number.isFinite(total) || total < 0) return null;
    hours = Math.floor(total / 3600);
    minutes = Math.floor((total % 3600) / 60);
    seconds = total % 60;
  }

  let iso = "PT";
  if (hours) iso += `${hours}H`;
  if (minutes || (hours && seconds)) iso += `${minutes}M`;
  if (seconds) iso += `${seconds}S`;
  if (iso === "PT") return "PT0S";
  return iso;
}

function youtubeVideoId(url) {
  if (!url || typeof url !== "string") return null;
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id || null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (parsed.pathname === "/watch") return parsed.searchParams.get("v") || null;
    const match = parsed.pathname.match(/\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    return match ? match[1] : null;
  }
  return null;
}

function spotifyEpisodeId(url) {
  if (!url || typeof url !== "string") return null;
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  if (host !== "open.spotify.com") return null;
  const match = parsed.pathname.match(/\/episode\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Apple episode links look like
 * https://podcasts.apple.com/us/podcast/unit-economics/id1856362735?i=1000793637451
 * The official player is the same path on embed.podcasts.apple.com.
 * Show-only URLs (no `i`) are not an episode embed.
 */
function appleEmbedSrc(url) {
  if (!url || typeof url !== "string") return null;
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  if (host !== "podcasts.apple.com" && host !== "embed.podcasts.apple.com") {
    return null;
  }
  if (!parsed.searchParams.get("i")) return null;
  parsed.protocol = "https:";
  parsed.hostname = "embed.podcasts.apple.com";
  return parsed.toString();
}

/**
 * Official episode embeds for the Listen section, in site order.
 * A platform is omitted when the sheet link is missing or is only the
 * show/channel fallback.
 */
function listenOptions(episode) {
  if (!episode) return [];
  const label = episode.brand || episode.title || "this episode";
  const options = [];

  const spotifyId = spotifyEpisodeId(episode.spotify);
  if (spotifyId) {
    options.push({
      key: "spotify",
      label: "Spotify",
      src: `https://open.spotify.com/embed/episode/${spotifyId}?utm_source=generator&theme=0`,
      title: `${label} on Spotify`,
      height: 152,
    });
  }

  const appleSrc = appleEmbedSrc(episode.apple);
  if (appleSrc) {
    options.push({
      key: "apple",
      label: "Apple Podcasts",
      src: appleSrc,
      title: `${label} on Apple Podcasts`,
      height: 175,
      sandbox:
        "allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation",
    });
  }

  const videoId = youtubeVideoId(episode.youtube);
  if (videoId) {
    options.push({
      key: "youtube",
      label: "YouTube",
      src: `https://www.youtube-nocookie.com/embed/${videoId}`,
      title: `${label} on YouTube`,
      video: true,
    });
  }

  return options;
}

function normalizeWebsite(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  return `https://${trimmed}`;
}

function websiteLabel(url) {
  const href = normalizeWebsite(url);
  if (!href) return "";
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function formatEpisodeNumber(id) {
  if (id === null || id === undefined || id === "") return "";
  const n = Number(id);
  if (!Number.isFinite(n)) return "";
  return `E. ${n}`;
}

function artworkAlt(episode) {
  const brand = (episode?.brand || episode?.title || "").trim();
  const guest = (episode?.guest || "").trim();
  if (brand && guest) return `Episode artwork for ${brand} with ${guest}`;
  if (brand) return `Episode artwork for ${brand}`;
  return "Unit Economics episode artwork";
}

const STOPWORDS = new Set(
  `a an the and or of to in on for with from we i you it this that is are was were be as at by about into how what when who their they his her our its but not have has had will can just than then also more most some these those there here my me he she him them your if so do does did been being over after before out up down off which while where why because during through between both each few other such no nor too very now episode today conversation founder company business sit down hope enjoy learned lastly discuss talk talks think thinks`.split(
    /\s+/
  )
);

function episodeText(episode) {
  const notes = Array.isArray(episode?.descriptionParagraphs)
    ? episode.descriptionParagraphs.join(" ")
    : "";
  return [episode?.title, episode?.brand, episode?.category, episode?.desc, notes]
    .filter(Boolean)
    .join(" ");
}

function termFreq(text) {
  const counts = new Map();
  const words = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/);
  for (const word of words) {
    if (word.length < 3 || STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return counts;
}

let vectorCacheKey = "";
let vectorCache = null;

function corpusVectors(episodes) {
  let key = String(episodes.length);
  for (const episode of episodes) {
    key += `\n${episode.slug || ""}\n${episodeText(episode)}`;
  }
  if (key === vectorCacheKey && vectorCache) return vectorCache;

  const rows = episodes.map((episode) => ({
    episode,
    tf: termFreq(episodeText(episode)),
  }));
  const df = new Map();
  for (const row of rows) {
    for (const term of row.tf.keys()) df.set(term, (df.get(term) || 0) + 1);
  }
  const idf = new Map();
  const total = rows.length || 1;
  for (const [term, docs] of df) {
    idf.set(term, Math.log((total + 1) / (docs + 1)) + 1);
  }
  vectorCacheKey = key;
  vectorCache = { rows, idf };
  return vectorCache;
}

function cosine(tfA, tfB, idf) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, countA] of tfA) {
    const weightA = countA * (idf.get(term) || 0);
    normA += weightA * weightA;
    const countB = tfB.get(term);
    if (countB) dot += weightA * countB * (idf.get(term) || 0);
  }
  for (const [term, countB] of tfB) {
    const weightB = countB * (idf.get(term) || 0);
    normB += weightB * weightB;
  }
  if (!normA || !normB) return 0;
  return dot / Math.sqrt(normA * normB);
}

function publishedBySlug(episodes) {
  const map = new Map();
  if (!Array.isArray(episodes)) return map;
  for (const episode of episodes) {
    if (!episode || episode.published === false || !episode.slug) continue;
    if (!map.has(episode.slug)) map.set(episode.slug, episode);
  }
  return map;
}

function overrideSlugs(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((slug) => typeof slug === "string" && slug.trim())
    .map((slug) => slug.trim());
}

// Outgoing mentions (this episode names the other) outweigh incoming ones
// (the other episode names this one) without letting a much larger incoming
// count lose to a single outgoing mention.
const OUTGOING_MENTION_WEIGHT = 10;
const INCOMING_MENTION_WEIGHT = 9;

function mentionRows(value) {
  if (!Array.isArray(value)) return [];
  const rows = [];
  for (const item of value) {
    if (!item || typeof item.slug !== "string" || !item.slug.trim()) continue;
    const count = Number(item.count);
    rows.push({
      slug: item.slug.trim(),
      count: Number.isFinite(count) ? Math.max(0, count) : 0,
    });
  }
  return rows;
}

/**
 * Connections from data/episode-mentions.json are directional in the file.
 * Ranking uses both directions: this episode's outgoing mentions, plus
 * incoming mentions where another episode names this one. Weights are summed
 * when both directions exist. Equal weights break on slug.
 */
function mentionSlugs(mentions, slug) {
  if (!slug || !mentions || typeof mentions !== "object" || Array.isArray(mentions)) return [];
  const scores = new Map();

  function add(other, weight) {
    if (!other || other === slug) return;
    scores.set(other, (scores.get(other) || 0) + weight);
  }

  for (const row of mentionRows(mentions[slug])) {
    add(row.slug, row.count * OUTGOING_MENTION_WEIGHT);
  }

  for (const [otherSlug, rows] of Object.entries(mentions)) {
    if (otherSlug === slug) continue;
    for (const row of mentionRows(rows)) {
      if (row.slug !== slug) continue;
      add(otherSlug, row.count * INCOMING_MENTION_WEIGHT);
    }
  }

  return [...scores.entries()]
    .sort((a, b) => {
      if (a[1] !== b[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([other]) => other);
}

/**
 * Three other published episodes, in this order:
 * 1. Slugs pinned in data/related-overrides.json, in file order.
 * 2. Transcript mentions from data/episode-mentions.json. Outgoing mentions
 *    and incoming mentions (another episode names this one) both count.
 *    Outgoing mentions weigh slightly more. Highest weight first.
 * 3. TF-IDF similarity, same category before other categories.
 * The current episode is never included, and a slug is never repeated.
 * Unknown slugs and a missing mentions file are skipped.
 * Similarity is computed from the catalog already loaded at build or revalidation.
 */
function relatedEpisodes(episodes, current, limit = 3, sources = {}) {
  if (!current || !Array.isArray(episodes) || limit < 1) return [];

  const bySlug = publishedBySlug(episodes);
  const published = [...bySlug.values()];
  const { rows, idf } = corpusVectors(published);
  const currentRow = rows.find((row) => row.episode.slug === current.slug);
  const currentTf = currentRow ? currentRow.tf : termFreq(episodeText(current));

  const ranked = [];
  const rankedSeen = new Set();
  for (const row of rows) {
    if (row.episode.slug === current.slug || rankedSeen.has(row.episode.slug)) continue;
    rankedSeen.add(row.episode.slug);
    ranked.push({
      slug: row.episode.slug,
      same: Boolean(current.category) && row.episode.category === current.category,
      score: Math.round(cosine(currentTf, row.tf, idf) * 1e6) / 1e6,
    });
  }
  ranked.sort((a, b) => {
    if (a.same !== b.same) return a.same ? -1 : 1;
    if (a.score !== b.score) return b.score - a.score;
    return a.slug.localeCompare(b.slug);
  });

  const picked = [];
  const seen = new Set();
  if (current.slug) seen.add(current.slug);

  function take(slug) {
    if (!slug || seen.has(slug) || picked.length >= limit) return;
    const episode = bySlug.get(slug);
    if (!episode) return;
    seen.add(slug);
    picked.push(episode);
  }

  const slug = current.slug;
  const overrides = sources.overrides && typeof sources.overrides === "object" ? sources.overrides : {};
  const mentions = sources.mentions && typeof sources.mentions === "object" ? sources.mentions : {};
  for (const pinned of overrideSlugs(overrides[slug])) take(pinned);
  for (const mentioned of mentionSlugs(mentions, slug)) take(mentioned);
  for (const row of ranked) take(row.slug);

  return picked;
}

/**
 * https://www.linkedin.com/in/… or /pub/… only. Feed placeholders such as
 * linkedin.com/feed/# are not profiles and are ignored.
 */
function linkedinProfileUrl(value) {
  if (!value || typeof value !== "string") return null;
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "linkedin.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if ((parts[0] !== "in" && parts[0] !== "pub") || !parts[1]) return null;
  url.hash = "";
  url.search = "";
  return url.toString();
}

/**
 * Show notes stay plain text, except a LinkedIn profile anchor is kept.
 */
function htmlToBlocks(html) {
  if (!html || typeof html !== "string") return [];
  const withBreaks = html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n\n")
    .replace(/<\/\s*h[1-6]\s*>/gi, "\n\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\/\s*li\s*>/gi, "\n");

  const pieces = [];
  const anchor =
    /<\s*a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\s*\/\s*a\s*>/gi;
  let last = 0;
  let match;
  while ((match = anchor.exec(withBreaks))) {
    pieces.push({ raw: withBreaks.slice(last, match.index), href: null });
    const href = match[1] || match[2] || match[3] || "";
    const inner = match[4].replace(/<[^>]+>/g, "");
    pieces.push({ raw: inner, href: linkedinProfileUrl(href) });
    last = match.index + match[0].length;
  }
  pieces.push({ raw: withBreaks.slice(last), href: null });

  const paragraphs = [[]];
  for (const piece of pieces) {
    const cleaned = decodeEntities(piece.raw.replace(/<[^>]+>/g, ""));
    const bits = cleaned.split(/\n{2,}/);
    bits.forEach((bit, index) => {
      if (index > 0) paragraphs.push([]);
      const text = bit.replace(/[ \t]*\n[ \t]*/g, " ").replace(/[ \t]{2,}/g, " ");
      if (!text) return;
      paragraphs[paragraphs.length - 1].push(
        piece.href ? { text, href: piece.href } : { text }
      );
    });
  }

  return paragraphs
    .map((parts) => {
      if (!parts.length) return [];
      const copy = parts.map((part) => ({ ...part }));
      copy[0].text = copy[0].text.replace(/^\s+/, "");
      copy[copy.length - 1].text = copy[copy.length - 1].text.replace(/\s+$/, "");
      return copy.filter((part) => part.text);
    })
    .filter((parts) => parts.length);
}

function blocksToParagraphs(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((parts) => parts.map((part) => part.text).join("").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function linkedinFromBlocks(blocks) {
  if (!Array.isArray(blocks)) return null;
  for (const parts of blocks) {
    for (const part of parts) {
      const url = linkedinProfileUrl(part.href);
      if (url) return url;
    }
  }
  return null;
}

/**
 * Wrap the first plain-text mention of the guest when a profile URL is known
 * and the show notes do not already link that name.
 */
function linkGuestName(blocks, guest, url) {
  const profile = linkedinProfileUrl(url);
  const needle = (guest || "").trim();
  if (!profile || !needle || !Array.isArray(blocks)) return blocks || [];
  const already = blocks.some((parts) =>
    parts.some((part) => part.href && part.text.includes(needle))
  );
  if (already) return blocks;

  let done = false;
  return blocks.map((parts) => {
    if (done) return parts;
    const next = [];
    for (const part of parts) {
      if (done || part.href) {
        next.push(part);
        continue;
      }
      const index = part.text.indexOf(needle);
      if (index === -1) {
        next.push(part);
        continue;
      }
      done = true;
      if (index > 0) next.push({ text: part.text.slice(0, index) });
      next.push({ text: needle, href: profile });
      const rest = part.text.slice(index + needle.length);
      if (rest) next.push({ text: rest });
    }
    return next;
  });
}

function pageTitle(episode) {
  const name =
    (episode?.title || "").trim() ||
    [episode?.brand, episode?.guest].filter(Boolean).join(" — ");
  if (!name) return "Unit Economics";
  return `${name} | Unit Economics`;
}

function metaDescription(episode) {
  const curated = (episode?.desc || "").replace(/\s+/g, " ").trim();
  if (curated) return curated;

  const fallback = (
    (episode?.descriptionParagraphs && episode.descriptionParagraphs[0]) ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim();
  if (fallback) {
    if (fallback.length <= 240) return fallback;
    const cut = fallback.slice(0, 240);
    const lastSpace = cut.lastIndexOf(" ");
    const shortened = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim();
    return `${shortened}…`;
  }

  const who = [episode?.brand, episode?.guest].filter(Boolean).join(" with ");
  if (who) return `${who} — Unit Economics`;
  return "Unit Economics";
}

function episodePath(slug) {
  return `/episodes/${slug}`;
}

function canonicalUrl(slug) {
  return `${SITE_URL}${episodePath(slug)}`;
}

/**
 * Share images stay full color. Prefer the episode (or show) artwork.
 * The designed site card is only a last resort when the feed has no image.
 */
function shareImage(episode) {
  return episode?.image || FALLBACK_SHARE_IMAGE;
}

function descriptionText(episode) {
  const paragraphs = episode?.descriptionParagraphs || [];
  if (paragraphs.length) return paragraphs.join("\n\n");
  return (episode?.desc || "").trim();
}

function buildEpisodeJsonLd(episode) {
  if (!episode?.slug) return null;
  const url = canonicalUrl(episode.slug);
  const data = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    "@id": url,
    url,
    name: episode.title || episode.brand || "Unit Economics",
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "Unit Economics",
      url: SITE_URL,
    },
  };

  const description = descriptionText(episode);
  if (description) data.description = description;
  if (episode.isoDate) data.datePublished = episode.isoDate;
  if (episode.durationIso) data.duration = episode.durationIso;
  if (episode.id !== null && episode.id !== undefined && episode.id !== "") {
    const episodeNumber = Number(episode.id);
    if (Number.isFinite(episodeNumber)) data.episodeNumber = episodeNumber;
  }
  if (episode.image) data.image = episode.image;
  if (episode.guest) {
    data.actor = { "@type": "Person", name: episode.guest };
  }
  if (episode.audioUrl) {
    data.audio = {
      "@type": "AudioObject",
      contentUrl: episode.audioUrl,
    };
    if (episode.audioType) data.audio.encodingFormat = episode.audioType;
  }

  return data;
}

function jsonLdScript(episode) {
  const data = buildEpisodeJsonLd(episode);
  if (!data) return "";
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

module.exports = {
  SITE_URL,
  SUBSTACK_URL,
  FALLBACK_SHARE_IMAGE,
  parseTakeaways,
  asImageUrl,
  resolveEpisodeImage,
  htmlToParagraphs,
  htmlToBlocks,
  blocksToParagraphs,
  linkedinProfileUrl,
  linkedinFromBlocks,
  linkGuestName,
  toIsoDuration,
  youtubeVideoId,
  spotifyEpisodeId,
  appleEmbedSrc,
  listenOptions,
  normalizeWebsite,
  websiteLabel,
  formatEpisodeNumber,
  artworkAlt,
  relatedEpisodes,
  pageTitle,
  metaDescription,
  episodePath,
  canonicalUrl,
  shareImage,
  buildEpisodeJsonLd,
  jsonLdScript,
};
