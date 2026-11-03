const Parser = require("rss-parser");

const SUBSTACK_ORIGIN = "https://uepod.substack.com";
const SUBSTACK_RSS = `${SUBSTACK_ORIGIN}/feed`;
const SUBSTACK_ARCHIVE = `${SUBSTACK_ORIGIN}/api/v1/archive`;

// The public RSS feed only carries the latest 20 items, episodes and posts
// mixed. Asking the archive for 50 still comes back short of that (the first
// response is capped), so page by however many items actually arrived.
const ARCHIVE_PAGE_LIMIT = 12;
const ARCHIVE_MAX_PAGES = 40;
const BODY_CONCURRENCY = 6;

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

/**
 * Format a Substack timestamp as "Mon D, YYYY".
 * Substack's own byline is the UTC calendar day (`<time>` on the post).
 * Pacific time shifts posts published after midnight UTC back a day
 * ("On Public Relations." is Aug 10 there, not Aug 9). Episode dates use
 * their own formatter and are left alone.
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
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

function readingTimeFromWordCount(wordcount) {
  const words = Number(wordcount);
  if (!Number.isFinite(words) || words <= 0) return "";
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

/**
 * Podcast episodes are published into the same Substack RSS feed as written
 * posts. RSS marks those entries with an audio enclosure, so use that stable
 * metadata instead of relying on title or description conventions.
 */
function isPodcastEpisode(item) {
  return item.enclosure?.type?.toLowerCase().startsWith("audio/") || false;
}

/**
 * Archive entries use `type` instead of an RSS enclosure. Episodes are
 * "podcast"; written posts are "newsletter". A newsletter stays a post even
 * if Substack has attached audio to it.
 */
function isWrittenArchiveItem(item) {
  if (!item || typeof item !== "object") return false;
  if (item.type === "podcast") return false;
  if (item.type === "newsletter") return true;
  return !item.podcast_url && Boolean(item.title || item.canonical_url);
}

function archiveItemToPost(item, index, bodyHtml) {
  const link =
    item.canonical_url ||
    (item.slug ? `${SUBSTACK_ORIGIN}/p/${item.slug}` : SUBSTACK_ORIGIN);
  const fromBody = readingTime(bodyHtml);
  return {
    id: link || (item.id != null ? String(item.id) : `post-${index}`),
    title: item.title || "Untitled",
    link,
    date: formatDate(item.post_date),
    isoDate: item.post_date || null,
    excerpt: toExcerpt(item.description || item.subtitle || item.truncated_body_text || ""),
    readingTime: fromBody || readingTimeFromWordCount(item.wordcount),
  };
}

function byNewest(a, b) {
  const ta = Date.parse(a.isoDate || "") || 0;
  const tb = Date.parse(b.isoDate || "") || 0;
  return tb - ta;
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const index = next++;
        out[index] = await fn(items[index], index);
      }
    }
  );
  await Promise.all(workers);
  return out;
}

async function defaultGetArchivePage(offset, limit) {
  const url = `${SUBSTACK_ARCHIVE}?sort=new&limit=${limit}&offset=${offset}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Substack archive responded ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Substack archive returned an unexpected payload");
  }
  return data;
}

async function defaultGetPostBody(slug) {
  const url = `${SUBSTACK_ORIGIN}/api/v1/posts/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Substack post ${slug} responded ${res.status}`);
  }
  const data = await res.json();
  return data && typeof data.body_html === "string" ? data.body_html : "";
}

async function defaultGetRssItems() {
  const parser = new Parser({
    timeout: 8000,
    customFields: {
      item: [["content:encoded", "contentEncoded"]],
    },
  });
  const feed = await parser.parseURL(SUBSTACK_RSS);
  return feed.items || [];
}

/**
 * Walk archive pages until Substack has nothing newer left to give. A short
 * page is not the end: the first response is smaller than `limit` even when
 * older posts exist. Advance by the number of items actually returned.
 */
async function fetchArchiveItems(getArchivePage) {
  const items = [];
  const seen = new Set();
  let offset = 0;

  for (let page = 0; page < ARCHIVE_MAX_PAGES; page++) {
    let batch;
    try {
      batch = await getArchivePage(offset, ARCHIVE_PAGE_LIMIT);
    } catch (err) {
      if (items.length === 0) throw err;
      console.error(
        "Substack archive page failed, using posts already fetched:",
        err.message
      );
      break;
    }

    if (!Array.isArray(batch) || batch.length === 0) break;

    let added = 0;
    for (const item of batch) {
      const key = item && (item.id != null ? item.id : item.canonical_url);
      if (key == null || seen.has(key)) continue;
      seen.add(key);
      items.push(item);
      added++;
    }
    if (added === 0) break;
    offset += batch.length;
  }

  return items;
}

async function postsFromArchiveItems(items, getPostBody) {
  const written = items.filter(isWrittenArchiveItem);
  let bodyFailures = 0;
  let bodyFailureMessage = "";
  const bodies = await mapPool(written, BODY_CONCURRENCY, async (item) => {
    if (!getPostBody || !item.slug) return "";
    try {
      return await getPostBody(item.slug);
    } catch (err) {
      bodyFailures += 1;
      if (!bodyFailureMessage) bodyFailureMessage = err.message;
      return "";
    }
  });

  if (bodyFailures > 0) {
    console.error(
      `Substack post body unavailable for ${bodyFailures} post${
        bodyFailures === 1 ? "" : "s"
      }; used word count for reading time. ${bodyFailureMessage}`
    );
  }

  return written
    .map((item, index) => archiveItemToPost(item, index, bodies[index]))
    .sort(byNewest);
}

/**
 * Fetch and normalize Substack posts.
 * Shape mirrors fetchEpisodes so the UI stays consistent.
 *
 * The archive is the source of the full written-post list. RSS is only a
 * fallback so the Read tab still has posts when Substack refuses the archive.
 */
async function fetchPosts({
  getArchivePage = defaultGetArchivePage,
  getPostBody = defaultGetPostBody,
  getRssItems = defaultGetRssItems,
} = {}) {
  try {
    const items = await fetchArchiveItems(getArchivePage);
    const posts = await postsFromArchiveItems(items, getPostBody);
    if (posts.length > 0) return posts;
    console.error(
      "Substack archive returned no written posts, falling back to RSS."
    );
  } catch (err) {
    console.error(
      "Substack archive fetch failed, falling back to RSS:",
      err.message
    );
  }

  const rssItems = await getRssItems();
  return (rssItems || [])
    .filter((item) => !isPodcastEpisode(item))
    .map((item, i) => {
      const body = item.contentEncoded || item.content || "";
      return {
        id: item.guid || item.link || `post-${i}`,
        title: item.title || "Untitled",
        link: item.link || SUBSTACK_ORIGIN,
        date: formatDate(item.isoDate || item.pubDate),
        isoDate: item.isoDate || item.pubDate || null,
        excerpt: toExcerpt(item.contentSnippet || body),
        readingTime: readingTime(body),
      };
    });
}

module.exports = {
  fetchPosts,
  isPodcastEpisode,
  isWrittenArchiveItem,
  ARCHIVE_PAGE_LIMIT,
};
