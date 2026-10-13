const test = require("node:test");
const assert = require("node:assert/strict");

const { buildLlmsTxt, episodesForLlms, shownEpisodeTitle } = require("../src/lib/llms");
const {
  HOMEPAGE_DESCRIPTION,
  HOST_NAME,
  PUBLIC_SITE_URL,
  RSS_URL,
  SHOW_URLS,
  buildPodcastSeriesJsonLd,
  podcastSeriesJsonLdScript,
} = require("../src/lib/site");
const { buildEpisodeJsonLd } = require("../src/lib/episodePage");

const INTRO = [
  "# Unit Economics",
  "",
  `> ${HOMEPAGE_DESCRIPTION} Hosted by ${HOST_NAME}.`,
  "",
  "Guests are founders, operators and investors, primarily focused on consumer brands and businesses. Conversations cover pricing, margins, operations, distribution, fundraising, and growth.",
  "",
  "## Episodes",
].join("\n");

test("llms.txt lists every episode newest first with the on-site title", () => {
  const episodes = [
    {
      slug: "older-show",
      brand: "Older Show",
      rawDate: "2024-01-02T00:00:00.000Z",
    },
    {
      slug: "newest-show",
      brand: "Newest Show",
      title: "[Newest Show] Ignored Guest",
      rawDate: "2026-05-01T00:00:00.000Z",
    },
    { slug: "draft-show", brand: "Draft Show" },
    { brand: "No slug" },
  ];

  assert.equal(shownEpisodeTitle(episodes[1]), "Newest Show");
  assert.deepEqual(
    episodesForLlms(episodes).map((episode) => episode.slug),
    ["newest-show", "older-show", "draft-show"]
  );

  const text = buildLlmsTxt(episodes);
  assert.ok(text.startsWith(`${INTRO}\n`));
  assert.equal(text.includes("\u2014"), false);
  assert.equal(text.includes("\u2013"), false);

  const links = text
    .split("\n")
    .filter((line) => line.startsWith("- [") && line.includes("/episodes/"));
  assert.deepEqual(links, [
    `- [Newest Show](${PUBLIC_SITE_URL}/episodes/newest-show)`,
    `- [Older Show](${PUBLIC_SITE_URL}/episodes/older-show)`,
    `- [Draft Show](${PUBLIC_SITE_URL}/episodes/draft-show)`,
  ]);

  assert.match(
    text,
    new RegExp(
      [
        "## More",
        `- \\[Glossary\\]\\(${PUBLIC_SITE_URL}/glossary\\): industry terms used on the show`,
        `- \\[Partners\\]\\(${PUBLIC_SITE_URL}/partners\\)`,
        `- \\[Newsletter\\]\\(${SHOW_URLS.substack.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
        `- \\[Spotify\\]\\(${SHOW_URLS.spotify.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
        `- \\[Apple Podcasts\\]\\(${SHOW_URLS.apple.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
        `- \\[YouTube\\]\\(${SHOW_URLS.youtube.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
        "",
      ].join("\n")
    )
  );
  assert.equal(text.endsWith("\n"), true);
});

test("homepage PodcastSeries JSON-LD is valid JSON from site config", () => {
  const script = podcastSeriesJsonLdScript();
  const data = JSON.parse(script);
  const built = buildPodcastSeriesJsonLd();

  assert.deepEqual(data, built);
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "PodcastSeries");
  assert.equal(data.name, "Unit Economics");
  assert.equal(data.description, HOMEPAGE_DESCRIPTION);
  assert.equal(data.url, "https://www.uepod.com");
  assert.equal(PUBLIC_SITE_URL, "https://www.uepod.com");
  assert.deepEqual(data.author, { "@type": "Person", name: "Josh Stabinsky" });
  assert.deepEqual(data.host, { "@type": "Person", name: "Josh Stabinsky" });
  assert.equal(data.webFeed, RSS_URL);
  assert.deepEqual(data.sameAs, [
    SHOW_URLS.spotify,
    SHOW_URLS.apple,
    SHOW_URLS.youtube,
    SHOW_URLS.substack,
  ]);
  assert.equal(script.includes("\u2014"), false);
});

test("episode JSON-LD stays a PodcastEpisode", () => {
  const json = buildEpisodeJsonLd({
    slug: "mikeys-pies-mikey-deegan",
    title: "[Mikey's Pies] Mikey Deegan",
    brand: "Mikey's Pies",
    guest: "Mikey Deegan",
  });
  assert.equal(json["@type"], "PodcastEpisode");
  assert.equal(json.partOfSeries["@type"], "PodcastSeries");
  assert.equal(json.partOfSeries.url, "https://uepod.com");
  assert.equal(json.webFeed, undefined);
  assert.equal(json.host, undefined);
});
