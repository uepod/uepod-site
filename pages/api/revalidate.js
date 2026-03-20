/**
 * Vercel Cron Job endpoint â€” triggers daily at 10:00 UTC.
 * Calls res.revalidate('/') to rebuild the homepage with fresh RSS data.
 *
 * To add a secret for security, set REVALIDATION_SECRET in Vercel env vars
 * and pass ?secret=YOUR_SECRET when calling manually.
 */
export default async function handler(req, res) {
  // Optional: verify secret for manual triggers
  if (req.query.secret && req.query.secret !== process.env.REVALIDATION_SECRET) {
    return res.status(401).json({ message: "Invalid secret" });
  }

  try {
    await res.revalidate("/");
    return res.json({ revalidated: true, timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ message: "Error revalidating", error: err.message });
  }
}
