const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseTakeaways,
  resolveEpisodeImage,
  htmlToParagraphs,
  toIsoDuration,
  normalizeWebsite,
  websiteLabel,
  relatedEpisodes,
  artworkAlt,
  buildEpisodeJsonLd,
  shareImage,
  FALLBACK_SHARE_IMAGE,
} = require("../src/lib/episodePage");

test("takeaways stay empty until a sheet cell has them", () => {
  assert.deepEqual(parseTakeaways(undefined), []);
  assert.deepEqual(parseTakeaways(""), []);
  assert.deepEqual(parseTakeaways("   "), []);
});

test("takeaways split on pipes or newlines and keep the written text", () => {
  assert.deepEqual(parseTakeaways("First point | Second point"), [
    "First point",
    "Second point",
  ]);
  assert.deepEqual(parseTakeaways("One\nTwo\n"), ["One", "Two"]);
});

test("episode artwork prefers the item image and falls back to the show", () => {
  const show = "https://cdn.example/show.jpg";
  assert.equal(
    resolveEpisodeImage(
      { itunesImage: { $: { href: "https://cdn.example/ep.jpg" } } },
      show
    ),
    "https://cdn.example/ep.jpg"
  );
  assert.equal(
    resolveEpisodeImage({ itunes: { image: "https://cdn.example/itunes.jpg" } }, show),
    "https://cdn.example/itunes.jpg"
  );
  assert.equal(resolveEpisodeImage({}, show), show);
  assert.equal(resolveEpisodeImage({}, ""), null);
});

test("show notes become plain paragraphs without markup", () => {
  const paragraphs = htmlToParagraphs(
    "<p>On today’s episode, I sit down with <a href=\"https://example.com\"><strong>Mikey’s Pies</strong></a>.</p><p>Second paragraph.</p>"
  );
  assert.equal(paragraphs.length, 2);
  assert.match(paragraphs[0], /Mikey’s Pies/);
  assert.equal(paragraphs[0].includes("<"), false);
  assert.equal(paragraphs[1], "Second paragraph.");
});

test("duration converts to ISO 8601", () => {
  assert.equal(toIsoDuration("00:48:00"), "PT48M");
  assert.equal(toIsoDuration("01:01:36"), "PT1H1M36S");
  assert.equal(toIsoDuration(""), null);
});

test("website links gain a protocol and keep an existing one", () => {
  assert.equal(normalizeWebsite("mikeyspies.com"), "https://mikeyspies.com");
  assert.equal(
    normalizeWebsite("https://www.tofugosnacks.com/"),
    "https://www.tofugosnacks.com/"
  );
  assert.equal(normalizeWebsite(""), null);
  assert.equal(websiteLabel("https://www.tofugosnacks.com/"), "tofugosnacks.com");
});

test("related episodes are the same category, excluding the current one", () => {
  const episodes = [
    { slug: "a", category: "Food & Beverage", published: true },
    { slug: "b", category: "Food & Beverage", published: true },
    { slug: "c", category: "Logistics", published: true },
    { slug: "d", category: "Food & Beverage", published: true },
    { slug: "e", category: "Food & Beverage", published: true },
    { slug: "draft", category: "Food & Beverage", published: false },
  ];
  const related = relatedEpisodes(episodes, episodes[0], 3);
  assert.deepEqual(
    related.map((episode) => episode.slug),
    ["b", "d", "e"]
  );
});

test("JSON-LD uses the full-color artwork, guest, and series", () => {
  const image = "https://cdn.example/mikey.jpg";
  const episode = {
    slug: "mikeys-pies-mikey-deegan",
    title: "[Mikey's Pies] Mikey Deegan",
    brand: "Mikey's Pies",
    guest: "Mikey Deegan",
    desc: "Short description.",
    descriptionParagraphs: ["Full show notes."],
    isoDate: "2026-10-07T10:00:00.000Z",
    durationIso: "PT48M",
    id: 65,
    image,
    audioUrl: "https://example.com/ep.mp3",
    audioType: "audio/mpeg",
    published: true,
  };

  assert.equal(artworkAlt(episode), "Episode artwork for Mikey's Pies with Mikey Deegan");
  assert.equal(shareImage(episode), image);
  assert.equal(shareImage({}), FALLBACK_SHARE_IMAGE);

  const json = buildEpisodeJsonLd(episode);
  assert.equal(json["@type"], "PodcastEpisode");
  assert.equal(json.image, image);
  assert.equal(json.actor.name, "Mikey Deegan");
  assert.equal(json.datePublished, "2026-10-07T10:00:00.000Z");
  assert.equal(json.partOfSeries["@type"], "PodcastSeries");
  assert.equal(json.partOfSeries.name, "Unit Economics");
  assert.equal(json.episodeNumber, 65);
  assert.equal(json.url, "https://uepod.com/episodes/mikeys-pies-mikey-deegan");
  assert.equal(JSON.stringify(json).includes("grayscale"), false);
});
