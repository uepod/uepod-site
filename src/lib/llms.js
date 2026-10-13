const {
  HOMEPAGE_DESCRIPTION,
  HOST_NAME,
  PUBLIC_SITE_URL,
  SHOW_URLS,
} = require("./site");

/**
 * Heading text the episode cards and episode pages show: brand, then the
 * stored title when a row has no brand.
 */
function shownEpisodeTitle(episode) {
  const brand = String(episode?.brand || "").replace(/\s+/g, " ").trim();
  if (brand) return brand;
  const title = String(episode?.title || "").replace(/\s+/g, " ").trim();
  if (title) return title;
  return String(episode?.slug || "").trim();
}

function escapeLinkLabel(label) {
  return String(label)
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

function episodeTime(episode) {
  const raw = episode?.rawDate || episode?.isoDate || "";
  const time = Date.parse(raw);
  return Number.isFinite(time) ? time : null;
}

/** Same episode set the sitemap lists: every row with a slug, newest first. */
function episodesForLlms(episodes) {
  return (episodes || [])
    .filter((episode) => episode && episode.slug)
    .map((episode, index) => ({ episode, index }))
    .sort((a, b) => {
      const left = episodeTime(a.episode);
      const right = episodeTime(b.episode);
      if (left !== null && right !== null && left !== right) return right - left;
      if (left !== null && right === null) return -1;
      if (left === null && right !== null) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.episode);
}

function buildLlmsTxt(episodes) {
  const episodeLines = episodesForLlms(episodes).map((episode) => {
    const title = escapeLinkLabel(shownEpisodeTitle(episode));
    return `- [${title}](${PUBLIC_SITE_URL}/episodes/${episode.slug})`;
  });

  return [
    "# Unit Economics",
    "",
    `> ${HOMEPAGE_DESCRIPTION} Hosted by ${HOST_NAME}.`,
    "",
    "Guests are founders, operators and investors, primarily focused on consumer brands and businesses. Conversations cover pricing, margins, operations, distribution, fundraising, and growth.",
    "",
    "## Episodes",
    ...episodeLines,
    "",
    "## More",
    `- [Glossary](${PUBLIC_SITE_URL}/glossary): industry terms used on the show`,
    `- [Partners](${PUBLIC_SITE_URL}/partners)`,
    `- [Newsletter](${SHOW_URLS.substack})`,
    `- [Spotify](${SHOW_URLS.spotify})`,
    `- [Apple Podcasts](${SHOW_URLS.apple})`,
    `- [YouTube](${SHOW_URLS.youtube})`,
    "",
  ].join("\n");
}

module.exports = {
  shownEpisodeTitle,
  episodesForLlms,
  buildLlmsTxt,
};
