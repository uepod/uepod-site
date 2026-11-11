const sharp = require("sharp");

const SHARE_WIDTH = 1200;
const SHARE_HEIGHT = 630;
// ~63% of the 630px card, leaving margin so Reddit's crop and bottom title
// bar do not cut off the Unit Economics wordmark.
const COVER_SIZE = 400;
// sharp's blur() takes a Gaussian sigma. 100 matches a radius of about 100
// and, with the 300px downscale, keeps type from smearing into blotches.
const BLUR_SIGMA = 100;
const BACKGROUND_BRIGHTNESS = 0.9;
const MEDIAN_BLEND = 0.6;
const SOFT_SIZE = 300;
const MEDIAN_SAMPLE = 50;
const SHADOW_PAD = 24;
const SHADOW_BLUR = 16;
const SHADOW_OFFSET_Y = 6;
const SHADOW_ALPHA = 0.28;

/**
 * Where the sharp 400×400 cover sits on the 1200×630 card.
 * Horizontally centered. Vertically, prefer the canvas center, but raise
 * the cover if needed so it stays in the band Reddit leaves visible: a
 * center crop to 500px with the bottom 20% covered by a title bar.
 */
function coverPlacement(
  canvasWidth = SHARE_WIDTH,
  canvasHeight = SHARE_HEIGHT,
  coverSize = COVER_SIZE
) {
  const left = Math.round((canvasWidth - coverSize) / 2);
  const centeredTop = Math.round((canvasHeight - coverSize) / 2);
  const redditCropTop = Math.round((canvasHeight - 500) / 2);
  const redditBarTop = redditCropTop + 400;
  const top = Math.min(centeredTop, Math.max(redditCropTop, redditBarTop - coverSize));
  return {
    width: coverSize,
    height: coverSize,
    left,
    top,
  };
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (!sorted.length) return 0;
  if (sorted.length % 2) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Median color of a raw RGB or RGBA buffer. Each channel is taken separately.
 */
function medianColor(raw, width, height, channels = 3) {
  const reds = [];
  const greens = [];
  const blues = [];
  const count = width * height;
  for (let i = 0; i < count; i++) {
    const offset = i * channels;
    reds.push(raw[offset]);
    greens.push(raw[offset + 1]);
    blues.push(raw[offset + 2]);
  }
  return { r: median(reds), g: median(greens), b: median(blues) };
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

  const sample = await sharp(oriented)
    .resize(MEDIAN_SAMPLE, MEDIAN_SAMPLE, { fit: "cover", position: "centre" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const fill = medianColor(
    sample.data,
    sample.info.width,
    sample.info.height,
    sample.info.channels
  );

  const cropTop = Math.round((SHARE_WIDTH - SHARE_HEIGHT) / 2);
  const softened = await sharp(oriented)
    .resize(SOFT_SIZE, SOFT_SIZE, { fit: "cover", position: "centre" })
    .resize(SHARE_WIDTH, SHARE_WIDTH)
    .extract({ left: 0, top: cropTop, width: SHARE_WIDTH, height: SHARE_HEIGHT })
    .blur(BLUR_SIGMA)
    // Multiply RGB by 0.9. sharp's modulate({ brightness }) shifts hue.
    .linear(BACKGROUND_BRIGHTNESS, 0)
    .toBuffer();

  const tint = await sharp({
    create: {
      width: SHARE_WIDTH,
      height: SHARE_HEIGHT,
      channels: 4,
      background: { ...fill, alpha: MEDIAN_BLEND },
    },
  })
    .png()
    .toBuffer();

  const background = await sharp(softened)
    .composite([{ input: tint, blend: "over" }])
    .removeAlpha()
    .toBuffer();

  const place = coverPlacement();
  const cover = await sharp(oriented)
    .resize(place.width, place.height, { fit: "cover", position: "centre" })
    .toBuffer();

  const shadowBlock = await sharp({
    create: {
      width: place.width,
      height: place.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: SHADOW_ALPHA },
    },
  })
    .png()
    .toBuffer();
  const shadow = await sharp({
    create: {
      width: place.width + SHADOW_PAD * 2,
      height: place.height + SHADOW_PAD * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: shadowBlock,
        left: SHADOW_PAD,
        top: SHADOW_PAD + SHADOW_OFFSET_Y,
      },
    ])
    .blur(SHADOW_BLUR)
    .png()
    .toBuffer();

  return sharp(background)
    .composite([
      {
        input: shadow,
        left: place.left - SHADOW_PAD,
        top: place.top - SHADOW_PAD,
      },
      { input: cover, left: place.left, top: place.top },
    ])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

module.exports = {
  SHARE_WIDTH,
  SHARE_HEIGHT,
  COVER_SIZE,
  BLUR_SIGMA,
  BACKGROUND_BRIGHTNESS,
  MEDIAN_BLEND,
  medianColor,
  coverPlacement,
  artworkUrlForPublicEpisode,
  isFetchableImageUrl,
  composeShareCard,
};
