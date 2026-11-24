/**
 * Sponsor paragraphs stay in the episode About text, copied from the RSS item.
 * These helpers only keep that boilerplate out of the short card blurb and
 * out of related-episode matching, where the same read would drown the notes.
 */

/**
 * A paragraph is the pasted read when it mentions Rho or the offer URL.
 * Match is loose on purpose: the platform copy is not a fixed string.
 */
function paragraphMentionsSponsor(text) {
  const value = String(text || "");
  return /\brho\b/i.test(value) || /uepod\.com\/rho\b/i.test(value);
}

function blockText(parts) {
  if (!Array.isArray(parts)) return "";
  return parts.map((part) => (part && part.text) || "").join("");
}

function stripSponsorBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks.filter((parts) => {
    const text = blockText(parts).trim();
    return text && !paragraphMentionsSponsor(text);
  });
}

function stripSponsorText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !paragraphMentionsSponsor(paragraph))
    .join("\n\n");
}

/**
 * Show-notes blocks the episode page renders, in RSS order, links included.
 * Sheet short copy is only the fallback when the feed item has no notes.
 */
function descriptionBlocksForPage(episode) {
  if (episode?.descriptionBlocks?.length) return episode.descriptionBlocks;
  if (episode?.descriptionParagraphs?.length) {
    return episode.descriptionParagraphs.map((paragraph) => [{ text: paragraph }]);
  }
  if (episode?.desc) return [[{ text: episode.desc }]];
  return [];
}

module.exports = {
  paragraphMentionsSponsor,
  stripSponsorBlocks,
  stripSponsorText,
  descriptionBlocksForPage,
};
