const sharp = require("sharp");

const SHARE_WIDTH = 1200;
const SHARE_HEIGHT = 630;
const COVER_SIZE = 570;
const BLUR_SIGMA = 40;
const BACKGROUND_BRIGHTNESS = 0.85;

/**
 * Where the sharp 570×570 cover sits on the 1200×630 card.
 */
function coverPlacement(
  canvasWidth = SHARE_WIDTH,
  canvasHeight = SHARE_HEIGHT,
  coverSize = COVER_SIZE
) {
  return {
    width: coverSize,
    height: coverSize,
    left: Math.round((canvasWidth - coverSize) / 2),
    top: Math.round((canvasHeight - coverSize) / 2),
  };
}

/**
 * Artwork URL for a public episode. A sheet-only row is refused even when
 * its listen links are already filled in.
 */
function artworkUrlForPublicEpisode(episodes, slug) {
  if (!slug || typeof slug !== "string") return null;
  const episode = (episodes || []).find((item) => item && item.slug === slug);
  if (!episode || episode.published === false) return null;
  const image = typeof episode.image === "string" ? episode.image.trim() : "";
  return image || null;
}

function isFetchableImageUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0"
  ) {
    return false;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return false;
  return true;
}

async function composeShareCard(input) {
  const oriented = await sharp(input, { failOn: "none" }).rotate().toBuffer();
  const meta = await sharp(oriented).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Artwork has no dimensions");
  }

  const cropTop = Math.round((SHARE_WIDTH - SHARE_HEIGHT) / 2);
  const background = await sharp(oriented)
    .resize(SHARE_WIDTH, SHARE_WIDTH, { fit: "cover", position: "centre" })
    .extract({ left: 0, top: cropTop, width: SHARE_WIDTH, height: SHARE_HEIGHT })
    .blur(BLUR_SIGMA)
    // Multiply RGB by 0.85. sharp's modulate({ brightness }) shifts hue.
    .linear(BACKGROUND_BRIGHTNESS, 0)
    .toBuffer();

  const place = coverPlacement();
  const cover = await sharp(oriented)
    .resize(place.width, place.height, { fit: "cover", position: "centre" })
    .toBuffer();

  return sharp(background)
    .composite([{ input: cover, left: place.left, top: place.top }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

module.exports = {
  SHARE_WIDTH,
  SHARE_HEIGHT,
  COVER_SIZE,
  BLUR_SIGMA,
  BACKGROUND_BRIGHTNESS,
  coverPlacement,
  artworkUrlForPublicEpisode,
  isFetchableImageUrl,
  composeShareCard,
};
