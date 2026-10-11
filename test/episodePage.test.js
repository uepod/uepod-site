const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseTakeaways,
  resolveEpisodeImage,
  htmlToParagraphs,
  toIsoDuration,
  youtubeVideoId,
  spotifyEpisodeId,
  appleEmbedSrc,
  listenOptions,
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

test("player ids only come from episode links, not the channel or the show", () => {
  assert.equal(youtubeVideoId("https://youtu.be/UryCsPTJ-Sg"), "UryCsPTJ-Sg");
  assert.equal(
    youtubeVideoId("https://www.youtube.com/watch?v=JOzS8op2J2g"),
    "JOzS8op2J2g"
  );
  assert.equal(
    youtubeVideoId("https://www.youtube.com/@TheUnitEconomicsPodcast"),
    null
  );
  assert.equal(
    spotifyEpisodeId("https://open.spotify.com/episode/6DG2MmMkiAbGy15qZYzY64"),
    "6DG2MmMkiAbGy15qZYzY64"
  );
  assert.equal(
    spotifyEpisodeId("https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F"),
    null
  );
});

test("listen embeds use official players and skip show-level fallbacks", () => {
  const options = listenOptions({
    brand: "Mikey's Pies",
    spotify: "https://open.spotify.com/episode/6DG2MmMkiAbGy15qZYzY64?si=abc",
    apple:
      "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735?i=1000793637451",
    youtube: "https://youtu.be/UryCsPTJ-Sg",
  });
  assert.deepEqual(
    options.map((option) => option.key),
    ["spotify", "apple", "youtube"]
  );
  assert.equal(
    options[0].src,
    "https://open.spotify.com/embed/episode/6DG2MmMkiAbGy15qZYzY64?utm_source=generator&theme=0"
  );
  assert.equal(
    options[1].src,
    "https://embed.podcasts.apple.com/us/podcast/unit-economics/id1856362735?i=1000793637451"
  );
  assert.equal(
    options[2].src,
    "https://www.youtube-nocookie.com/embed/UryCsPTJ-Sg"
  );
  assert.equal(
    appleEmbedSrc("https://podcasts.apple.com/us/podcast/unit-economics/id1856362735"),
    null
  );
  assert.deepEqual(
    listenOptions({
      youtube: "https://www.youtube.com/@TheUnitEconomicsPodcast",
      spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F",
      apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735",
    }),
    []
  );
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

test("a unique category is filled with the nearest episodes by date", () => {
  const episodes = [
    { slug: "self", category: "Jewelry", published: true, isoDate: "2026-02-05T11:00:00.000Z" },
    { slug: "far", category: "Food", published: true, isoDate: "2025-01-01T00:00:00.000Z" },
    { slug: "before", category: "Food", published: true, isoDate: "2026-02-01T11:00:00.000Z" },
    { slug: "after", category: "Media", published: true, isoDate: "2026-02-10T11:00:00.000Z" },
    { slug: "closer-before", category: "Art", published: true, isoDate: "2026-02-04T11:00:00.000Z" },
    { slug: "draft", category: "Jewelry", published: false, isoDate: "2026-02-06T11:00:00.000Z" },
    { slug: "self", category: "Jewelry", published: true, isoDate: "2026-02-05T11:00:00.000Z" },
  ];
  const related = relatedEpisodes(episodes, episodes[0], 3);
  assert.deepEqual(
    related.map((episode) => episode.slug),
    ["closer-before", "before", "after"]
  );
  assert.equal(related.some((episode) => episode.slug === "self"), false);
  assert.equal(new Set(related.map((episode) => episode.slug)).size, 3);
});

test("same-category matches stay first and the nearest dates fill the rest", () => {
  const episodes = [
    { slug: "same-new", category: "Apparel", published: true, isoDate: "2026-08-01T00:00:00.000Z" },
    { slug: "self", category: "Apparel", published: true, isoDate: "2026-06-01T00:00:00.000Z" },
    { slug: "near", category: "Food", published: true, isoDate: "2026-06-02T00:00:00.000Z" },
    { slug: "tie-older", category: "Media", published: true, isoDate: "2026-05-28T00:00:00.000Z" },
    { slug: "tie-newer", category: "Art", published: true, isoDate: "2026-06-05T00:00:00.000Z" },
    { slug: "same-old", category: "Apparel", published: true, isoDate: "2025-01-01T00:00:00.000Z" },
  ];
  const related = relatedEpisodes(episodes, episodes[1], 3);
  assert.deepEqual(
    related.map((episode) => episode.slug),
    ["same-new", "same-old", "near"]
  );
});

test("an equal date distance prefers the newer episode", () => {
  const episodes = [
    { slug: "self", category: "Jewelry", published: true, isoDate: "2026-06-05T00:00:00.000Z" },
    { slug: "older", category: "Food", published: true, isoDate: "2026-06-01T00:00:00.000Z" },
    { slug: "newer", category: "Media", published: true, isoDate: "2026-06-09T00:00:00.000Z" },
  ];
  const related = relatedEpisodes(episodes, episodes[0], 2);
  assert.deepEqual(
    related.map((episode) => episode.slug),
    ["newer", "older"]
  );
});

test("a blank category still gets the nearest published episodes", () => {
  const episodes = [
    { slug: "self", category: "", published: true, isoDate: "2026-03-01T00:00:00.000Z" },
    { slug: "near", category: "Food", published: true, isoDate: "2026-03-02T00:00:00.000Z" },
    { slug: "next", category: "Media", published: true, isoDate: "2026-02-20T00:00:00.000Z" },
    { slug: "draft", category: "Food", published: false, isoDate: "2026-03-01T00:00:00.000Z" },
  ];
  const related = relatedEpisodes(episodes, episodes[0], 3);
  assert.deepEqual(
    related.map((episode) => episode.slug),
    ["near", "next"]
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
