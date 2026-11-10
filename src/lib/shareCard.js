const sharp = require("sharp");

const SHARE_WIDTH = 1200;
const SHARE_HEIGHT = 630;

/**
 * Fit the source inside the share frame. A square cover becomes 630×630,
 * centered, so the wide card shows the whole artwork.
 */
function containRect(
  srcWidth,
  srcHeight,
  canvasWidth = SHARE_WIDTH,
  canvasHeight = SHARE_HEIGHT
) {
  const widthIn = Number(srcWidth);
  const heightIn = Number(srcHeight);
  if (!widthIn || !heightIn) {
    return { width: 0, height: 0, left: 0, top: 0, canvasWidth, canvasHeight };
  }
  const scale = Math.min(canvasWidth / widthIn, canvasHeight / heightIn);
  const width = Math.max(1, Math.round(widthIn * scale));
  const height = Math.max(1, Math.round(heightIn * scale));
  return {
    width,
    height,
    left: Math.round((canvasWidth - width) / 2),
    top: Math.round((canvasHeight - height) / 2),
    canvasWidth,
    canvasHeight,
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
 * Color of the side bars. The left and right edges of these covers are the
 * flat background, so extending that color keeps the card continuous.
 */
function edgeColor(rgba, width, height, channels = 4) {
  const reds = [];
  const greens = [];
  const blues = [];
  const step = Math.max(1, Math.floor(height / 48));
  for (let y = 0; y < height; y += step) {
    for (const x of [0, width - 1]) {
      const index = (y * width + x) * channels;
      reds.push(rgba[index]);
      greens.push(rgba[index + 1]);
      blues.push(rgba[index + 2]);
    }
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
  const oriented = sharp(input, { failOn: "none" }).rotate();
  const meta = await oriented.metadata();
  const layout = containRect(meta.width, meta.height);
  if (!layout.width || !layout.height) {
    throw new Error("Artwork has no dimensions");
  }

  const sample = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(64, 64, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const background = edgeColor(
    sample.data,
    sample.info.width,
    sample.info.height,
    sample.info.channels
  );

  const resized = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(layout.width, layout.height, { fit: "fill" })
    .toBuffer();

  return sharp({
    create: {
      width: SHARE_WIDTH,
      height: SHARE_HEIGHT,
      channels: 3,
      background,
    },
  })
    .composite([{ input: resized, left: layout.left, top: layout.top }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

module.exports = {
  SHARE_WIDTH,
  SHARE_HEIGHT,
  containRect,
  edgeColor,
  artworkUrlForPublicEpisode,
  isFetchableImageUrl,
  composeShareCard,
};
