const Parser = require("rss-parser");

const SUBSTACK_RSS = "https://uepod.substack.com/feed";

/**
 * Format date from RSS pubDate to "Mon DD, YYYY"
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

/**
 * Strip HTML tags and decode the handful of entities Substack emits.
 */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#8217;|&rsquo;/g, "'")
    .replace(/&#8216;|&lsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;|&#8212;/g, "—")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trim to a clean excerpt on a word boundary.
 */
function toExcerpt(text, max = 220) {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).trim() + "…";
}

/**
 * Estimate reading time at 220 wpm.
 */
function readingTime(html) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  if (!words) return "";
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

/**
 * Fetch and normalize Substack posts.
 * Shape mirrors fetchEpisodes so the UI stays consistent.
 */
async function fetchPosts() {
  const parser = new Parser({
    timeout: 8000,
    customFields: {
      item: [["content:encoded", "contentEncoded"]],
    },
  });

  const feed = await parser.parseURL(SUBSTACK_RSS);

  return (feed.items || []).map((item, i) => {
    const body = item.contentEncoded || item.content || "";
    return {
      id: item.guid || item.link || `post-${i}`,
      title: item.title || "Untitled",
      link: item.link || SUBSTACK_RSS.replace("/feed", ""),
      date: formatDate(item.isoDate || item.pubDate),
      isoDate: item.isoDate || item.pubDate || null,
      excerpt: toExcerpt(item.contentSnippet || body),
      readingTime: readingTime(body),
    };
  });
}

module.exports = { fetchPosts };
