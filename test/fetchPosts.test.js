const test = require("node:test");
const assert = require("node:assert/strict");

const {
  fetchPosts,
  isPodcastEpisode,
  isWrittenArchiveItem,
  ARCHIVE_PAGE_LIMIT,
} = require("../src/lib/fetchPosts");

async function withoutConsoleError(fn) {
  const original = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = original;
  }
}

test("identifies Substack podcast episodes by their audio enclosure", () => {
  assert.equal(
    isPodcastEpisode({ enclosure: { type: "audio/mpeg" } }),
    true
  );
  assert.equal(
    isPodcastEpisode({ enclosure: { type: "AUDIO/X-M4A" } }),
    true
  );
});

test("keeps written posts with image or no enclosure", () => {
  assert.equal(
    isPodcastEpisode({ enclosure: { type: "image/jpeg" } }),
    false
  );
  assert.equal(isPodcastEpisode({}), false);
});

test("archive keeps newsletters and drops podcast episodes", () => {
  assert.equal(
    isWrittenArchiveItem({ type: "newsletter", title: "On Public Relations." }),
    true
  );
  assert.equal(
    isWrittenArchiveItem({
      type: "newsletter",
      title: "A written post with a voiceover",
      podcast_url: "https://example.com/audio.mp3",
    }),
    true
  );
  assert.equal(
    isWrittenArchiveItem({
      type: "podcast",
      title: "On conviction, cookies, and changing your mind.",
      podcast_url: "https://example.com/audio.mp3",
    }),
    false
  );
  assert.equal(isWrittenArchiveItem(null), false);
});

function archiveItem({
  id,
  type = "newsletter",
  title,
  date,
  slug,
  wordcount = 440,
  description = "A short summary.",
  podcast_url = null,
}) {
  return {
    id,
    type,
    title,
    post_date: date,
    canonical_url: `https://uepod.substack.com/p/${slug}`,
    slug,
    description,
    subtitle: description,
    wordcount,
    podcast_url,
  };
}

function words(count) {
  return `<p>${Array.from({ length: count }, () => "word").join(" ")}</p>`;
}

test("pages past a short archive response and lists every written post, newest first", async () => {
  const newer = [
    archiveItem({
      id: 1,
      type: "podcast",
      title: "Shelf Stable: What happened to Jones Soda?",
      date: "2026-11-02T11:00:00.000Z",
      slug: "jones",
    }),
    archiveItem({
      id: 2,
      title: "A Year in Review",
      date: "2026-11-01T20:45:34.673Z",
      slug: "a-year-in-review",
      wordcount: 1210,
      description:
        "Reflections on 1 year of conversations with founders, operators, and investors.",
    }),
  ];
  // Shorter than ARCHIVE_PAGE_LIMIT. Older written posts still exist.
  const older = [
    archiveItem({
      id: 3,
      type: "podcast",
      title: "[Joy Supply] Lindsay Leopold",
      date: "2026-08-12T10:00:00.000Z",
      slug: "joy",
    }),
    archiveItem({
      id: 4,
      title: "On conviction, cookies, and changing your mind.",
      date: "2026-08-16T21:33:33.735Z",
      slug: "on-conviction",
      wordcount: 1292,
    }),
    archiveItem({
      id: 5,
      title: "On Public Relations.",
      date: "2026-08-10T16:00:00.000Z",
      slug: "on-public-relations",
      description: "What PR firms actually do.",
    }),
    archiveItem({
      id: 6,
      title: "On external validation, Food Paint, and outbounding.",
      date: "2026-08-03T18:00:00.000Z",
      slug: "on-external-validation",
    }),
    archiveItem({
      id: 7,
      title: "A few things I learned this week.",
      date: "2026-07-27T17:00:00.000Z",
      slug: "a-few-things",
    }),
  ];

  const offsets = [];
  const posts = await fetchPosts({
    async getArchivePage(offset, limit) {
      offsets.push({ offset, limit });
      if (offset === 0) return newer;
      if (offset === newer.length) return older;
      if (offset === newer.length + older.length) return [];
      throw new Error(`unexpected offset ${offset}`);
    },
    async getPostBody(slug) {
      if (slug === "a-year-in-review") return words(1207);
      return "";
    },
    async getRssItems() {
      throw new Error("RSS should not be used when the archive has posts");
    },
  });

  assert.deepEqual(offsets, [
    { offset: 0, limit: ARCHIVE_PAGE_LIMIT },
    { offset: newer.length, limit: ARCHIVE_PAGE_LIMIT },
    { offset: newer.length + older.length, limit: ARCHIVE_PAGE_LIMIT },
  ]);
  assert.deepEqual(
    posts.map((post) => post.title),
    [
      "A Year in Review",
      "On conviction, cookies, and changing your mind.",
      "On Public Relations.",
      "On external validation, Food Paint, and outbounding.",
      "A few things I learned this week.",
    ]
  );
  assert.equal(posts[0].link, "https://uepod.substack.com/p/a-year-in-review");
  assert.equal(posts[0].date, "Nov 1, 2026");
  assert.equal(
    posts[0].excerpt,
    "Reflections on 1 year of conversations with founders, operators, and investors."
  );
  // Body word count wins over the archive word count when both exist.
  // 1207 words -> 5 min; wordcount 1210 would have rounded to 6.
  assert.equal(posts[0].readingTime, "5 min read");
  assert.equal(posts[1].date, "Aug 16, 2026");
  assert.equal(posts[1].readingTime, "6 min read");
  assert.equal(posts[4].date, "Jul 27, 2026");
});

test("stops paging when an archive page repeats items already seen", async () => {
  const only = archiveItem({
    id: 9,
    title: "On borrowing brand equity.",
    date: "2026-09-13T22:30:52.277Z",
    slug: "on-borrowing",
  });
  let calls = 0;
  const posts = await withoutConsoleError(() => fetchPosts({
    async getArchivePage() {
      calls += 1;
      if (calls > 3) throw new Error("archive paging did not stop");
      return [only];
    },
    async getPostBody() {
      return "";
    },
    async getRssItems() {
      throw new Error("RSS should not be used");
    },
  }));

  assert.equal(calls, 2);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].title, "On borrowing brand equity.");
  assert.equal(posts[0].date, "Sep 13, 2026");
});

test("falls back to the RSS feed when the archive refuses", async () => {
  let archiveCalls = 0;
  const posts = await withoutConsoleError(() => fetchPosts({
    async getArchivePage() {
      archiveCalls += 1;
      throw new Error("403");
    },
    async getPostBody() {
      throw new Error("post body should not be fetched");
    },
    async getRssItems() {
      return [
        {
          title: "Episode that must not appear",
          link: "https://uepod.substack.com/p/episode",
          guid: "https://uepod.substack.com/p/episode",
          isoDate: "2026-11-02T11:00:00.000Z",
          enclosure: { type: "audio/mpeg" },
          contentSnippet: "Listen now",
          contentEncoded: "<p>not a post</p>",
        },
        {
          title: "What (or who) is this show?",
          link: "https://uepod.substack.com/p/what-or-who",
          guid: "https://uepod.substack.com/p/what-or-who",
          isoDate: "2026-10-11T21:00:51.856Z",
          enclosure: { type: "image/jpeg" },
          contentSnippet: "Frozen pies, borrowed credibility.",
          contentEncoded: `<p>${Array.from({ length: 674 }, () => "word").join(" ")}</p>`,
        },
      ];
    },
  }));

  assert.equal(archiveCalls, 1);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].title, "What (or who) is this show?");
  assert.equal(posts[0].date, "Oct 11, 2026");
  assert.equal(posts[0].excerpt, "Frozen pies, borrowed credibility.");
  assert.equal(posts[0].readingTime, "3 min read");
  assert.equal(posts[0].link, "https://uepod.substack.com/p/what-or-who");
});

test("falls back to RSS when the archive has no written posts", async () => {
  const posts = await withoutConsoleError(() => fetchPosts({
    async getArchivePage(offset) {
      if (offset === 0) {
        return [
          archiveItem({
            id: 1,
            type: "podcast",
            title: "An episode",
            date: "2026-11-02T11:00:00.000Z",
            slug: "episode",
          }),
        ];
      }
      return [];
    },
    async getPostBody() {
      throw new Error("post body should not be fetched");
    },
    async getRssItems() {
      return [
        {
          title: "Kept from RSS",
          link: "https://uepod.substack.com/p/kept",
          isoDate: "2026-08-23T22:15:43.361Z",
          contentSnippet: "A few things I learned this week.",
          content: "<p>word</p>",
        },
      ];
    },
  }));

  assert.deepEqual(
    posts.map((post) => post.title),
    ["Kept from RSS"]
  );
  assert.equal(posts[0].readingTime, "1 min read");
  assert.equal(posts[0].date, "Aug 23, 2026");
});

test("keeps archive posts when a later page fails", async () => {
  const posts = await withoutConsoleError(() => fetchPosts({
    async getArchivePage(offset) {
      if (offset === 0) {
        return [
          archiveItem({
            id: 2,
            title: "On franchising, momentum, and in-person connection.",
            date: "2026-08-23T22:15:43.361Z",
            slug: "on-franchising",
            wordcount: 220,
          }),
        ];
      }
      throw new Error("timeout");
    },
    async getPostBody() {
      return "";
    },
    async getRssItems() {
      throw new Error("RSS should not replace posts already fetched");
    },
  }));

  assert.equal(posts.length, 1);
  assert.equal(
    posts[0].title,
    "On franchising, momentum, and in-person connection."
  );
  assert.equal(posts[0].readingTime, "1 min read");
});

test("Read tab dates use the UTC calendar day Substack prints", async () => {
  const samples = [
    ["2026-08-10T00:30:23.554Z", "On Public Relations.", "Aug 10, 2026"],
    [
      "2026-08-03T04:20:37.611Z",
      "On external validation, Food Paint, and outbounding.",
      "Aug 3, 2026",
    ],
    [
      "2026-07-27T02:23:08.364Z",
      "A few things I learned this week.",
      "Jul 27, 2026",
    ],
    ["2026-09-07T01:45:07.763Z", "Standing out on shelf. ", "Sep 7, 2026"],
    ["2026-11-01T20:45:34.673Z", "A Year in Review", "Nov 1, 2026"],
    ["2026-08-16T21:33:33.735Z", "On conviction, cookies, and changing your mind.", "Aug 16, 2026"],
  ];
  const posts = await fetchPosts({
    async getArchivePage(offset) {
      if (offset !== 0) return [];
      return samples.map(([date, title], index) =>
        archiveItem({
          id: index + 1,
          title,
          date,
          slug: `date-${index}`,
        })
      );
    },
    async getPostBody() {
      return "";
    },
    async getRssItems() {
      throw new Error("RSS should not be used");
    },
  });

  const byTitle = new Map(posts.map((post) => [post.title, post.date]));
  assert.deepEqual(
    samples.map(([, title]) => byTitle.get(title)),
    samples.map(([, , date]) => date)
  );
});

test("trims a long summary on a word boundary", async () => {
  const description = `${"alpha ".repeat(40)}omega ending that should be cut`;
  const posts = await fetchPosts({
    async getArchivePage(offset) {
      if (offset === 0) {
        return [
          archiveItem({
            id: 8,
            title: "On margins of error and paid acquisition.",
            date: "2026-09-27T20:35:50.145Z",
            slug: "on-margins",
            description,
          }),
        ];
      }
      return [];
    },
    async getPostBody() {
      return "";
    },
    async getRssItems() {
      throw new Error("RSS should not be used");
    },
  });

  assert.equal(posts.length, 1);
  assert.ok(posts[0].excerpt.endsWith("…"));
  assert.ok(posts[0].excerpt.length <= 221);
  assert.equal(posts[0].excerpt.includes("omega"), false);
});
