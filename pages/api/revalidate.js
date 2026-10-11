const { fetchEpisodeDirectory } = require("../../src/lib/fetchEpisodes");

/**
 * Vercel cron (5am and 1pm Pacific) rebuilds the homepage and episode pages
 * from the RSS feed and the Episode Metadata sheet.
 *
 * Episode pages also regenerate on their own: `fallback: "blocking"` renders
 * a slug that was not in the last build, and `revalidate: 900` refreshes a
 * page at most every 15 minutes. Unknown slugs 404, and that 404 is checked
 * again after the same window.
 *
 * To require a secret for manual triggers, set REVALIDATION_SECRET in Vercel
 * and pass ?secret=YOUR_SECRET.
 */
export default async function handler(req, res) {
  if (req.query.secret && req.query.secret !== process.env.REVALIDATION_SECRET) {
    return res.status(401).json({ message: "Invalid secret" });
  }

  const paths = ["/"];
  try {
    const episodes = await fetchEpisodeDirectory();
    for (const episode of episodes) {
      if (episode.slug) paths.push(`/episodes/${episode.slug}`);
    }
  } catch (err) {
    console.error("Episode list unavailable for revalidation:", err.message);
  }

  const revalidated = [];
  const errors = [];
  const queue = [...paths];

  async function worker() {
    while (queue.length) {
      const path = queue.shift();
      try {
        await res.revalidate(path);
        revalidated.push(path);
      } catch (err) {
        errors.push({ path, message: err.message });
      }
    }
  }

  await Promise.all(Array.from({ length: 4 }, () => worker()));

  return res.status(revalidated.length ? 200 : 500).json({
    revalidated: revalidated.length > 0,
    count: revalidated.length,
    paths: revalidated,
    errors,
    timestamp: new Date().toISOString(),
  });
}
