const { fetchEpisodeDirectory } = require("../src/lib/fetchEpisodes");
const { SITE_URL, canonicalUrl } = require("../src/lib/episodePage");

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lastmod(isoDate) {
  if (!isoDate || typeof isoDate !== "string") return "";
  const day = isoDate.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}

function generateSiteMap(episodes) {
  const urls = [
    `  <url>
    <loc>${SITE_URL}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
  ];

  for (const episode of episodes) {
    if (!episode.slug) continue;
    const modified = lastmod(episode.isoDate);
    urls.push(`  <url>
    <loc>${xmlEscape(canonicalUrl(episode.slug))}</loc>${
      modified ? `\n    <lastmod>${modified}</lastmod>` : ""
    }
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

export default function SiteMap() {
  // getServerSideProps handles the response
}

export async function getServerSideProps({ res }) {
  let episodes = [];
  try {
    episodes = await fetchEpisodeDirectory();
  } catch (err) {
    console.error("Sitemap episode fetch failed:", err.message);
  }

  res.setHeader("Content-Type", "text/xml");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=900, stale-while-revalidate"
  );
  res.write(generateSiteMap(episodes));
  res.end();

  return { props: {} };
}
