const { fetchEpisodeDirectory } = require("../../../src/lib/fetchEpisodes");
const { FALLBACK_TWITTER_IMAGE } = require("../../../src/lib/episodePage");
const {
  artworkUrlForPublicEpisode,
  isFetchableImageUrl,
  composeShareCard,
} = require("../../../src/lib/shareCard");

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_REDIRECTS = 3;

async function readImage(url, redirectsLeft = MAX_REDIRECTS) {
  if (!isFetchableImageUrl(url)) {
    throw new Error("Artwork URL is not fetchable");
  }
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": "uepod-share-card", Accept: "image/*,*/*" },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status >= 300 && response.status < 400) {
    const next = response.headers.get("location");
    if (!next || redirectsLeft <= 0) throw new Error("Artwork redirect failed");
    return readImage(new URL(next, url).toString(), redirectsLeft - 1);
  }
  if (!response.ok) throw new Error(`Artwork fetch failed: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_BYTES) {
    throw new Error("Artwork is an unexpected size");
  }
  return bytes;
}

function sendFallback(res) {
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
  res.redirect(302, FALLBACK_TWITTER_IMAGE);
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }

  const slug = String(req.query.slug || "").trim().toLowerCase();
  let imageUrl = null;
  try {
    const episodes = await fetchEpisodeDirectory();
    imageUrl = artworkUrlForPublicEpisode(episodes, slug);
  } catch (err) {
    console.error("Share card episode list failed:", err.message);
    return sendFallback(res);
  }

  if (!imageUrl) {
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
    return res.status(404).end();
  }

  try {
    const artwork = await readImage(imageUrl);
    const card = await composeShareCard(artwork);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800"
    );
    if (req.method === "HEAD") return res.status(200).end();
    return res.status(200).send(card);
  } catch (err) {
    console.error(`Share card failed for ${slug}:`, err.message);
    return sendFallback(res);
  }
}
