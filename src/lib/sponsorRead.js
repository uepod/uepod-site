/**
 * The Rho sponsor read shown on every episode page.
 * Josh pastes a version of this into platform descriptions, and the wording
 * changes. Those paragraphs are removed and this copy is the one the site shows.
 */

const RHO_URL = "https://rho.co";
const OFFER_URL = "https://uepod.com/rho";

const SPONSOR_READ = [
  { text: "This episode is brought to you in part by " },
  { text: "Rho", href: RHO_URL },
  {
    text: ", a paid partner of the show. Rho is the modern banking platform built for the AI era. Startups and growth-stage companies can open accounts in minutes, issue cards, manage expenses, pay bills, and close the books, all in one connected platform, backed by real human support that founders love. Right now, qualified Unit Economics listeners can get $100 when they open and fund an account at ",
  },
  { text: "uepod.com/rho", href: OFFER_URL },
  { text: ". Terms apply." },
];

function sponsorReadPlainText() {
  return SPONSOR_READ.map((part) => part.text).join("");
}

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
 * Show-notes blocks the episode page renders. Sheet short copy is the last
 * fallback, same as the page used before the sponsor read.
 */
function descriptionBlocksForPage(episode) {
  const raw = episode?.descriptionBlocks?.length
    ? episode.descriptionBlocks
    : episode?.descriptionParagraphs?.length
      ? episode.descriptionParagraphs.map((paragraph) => [{ text: paragraph }])
      : episode?.desc
        ? [[{ text: episode.desc }]]
        : [];
  return stripSponsorBlocks(raw);
}

module.exports = {
  RHO_URL,
  OFFER_URL,
  SPONSOR_READ,
  sponsorReadPlainText,
  paragraphMentionsSponsor,
  stripSponsorBlocks,
  stripSponsorText,
  descriptionBlocksForPage,
};
