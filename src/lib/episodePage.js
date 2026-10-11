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
  return String(n).padStart(2, "0");
}

function artworkAlt(episode) {
  const brand = (episode?.brand || episode?.title || "").trim();
  const guest = (episode?.guest || "").trim();
  if (brand && guest) return `Episode artwork for ${brand} with ${guest}`;
  if (brand) return `Episode artwork for ${brand}`;
  return "Unit Economics episode artwork";
}

/**
 * Up to three other published episodes in the same category.
 * The catalog is newest-first, so this keeps the most recent matches.
 */
function relatedEpisodes(episodes, current, limit = 3) {
  if (!current?.category || !Array.isArray(episodes)) return [];
  return episodes
    .filter(
      (episode) =>
        episode &&
        episode.published !== false &&
        episode.slug &&
        episode.slug !== current.slug &&
        episode.category === current.category
    )
    .slice(0, limit);
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
  toIsoDuration,
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
