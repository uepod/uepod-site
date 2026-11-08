const test = require("node:test");
const assert = require("node:assert/strict");

const { isPublicEpisode } = require("../src/lib/fetchEpisodes");
const { assignEpisodeNumbers } = require("../src/lib/episodePage");

const PREFILLED_LINKS = {
  spotify: "https://open.spotify.com/episode/abc",
  youtube: "https://youtu.be/abc",
  apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735?i=1",
  website: "foratravel.com",
  desc: "Prepared before the episode is in the feed.",
  title: "[Fora] Evan Frank",
};

function sheetRow(slug, extra = {}) {
  return {
    slug,
    spotify: null,
    youtube: null,
    apple: null,
    website: "guest.example",
    published: false,
    ...extra,
  };
}

test("a sheet row is not public until it is in the RSS", () => {
  assert.equal(isPublicEpisode(sheetRow("blake-mycoskie")), false);
  assert.equal(isPublicEpisode(null), false);
  assert.equal(isPublicEpisode(undefined), false);
  assert.equal(isPublicEpisode({ slug: "missing-flag" }), false);
});

test("pre-filled Spotify, YouTube, and Apple links do not publish a sheet row", () => {
  assert.equal(
    isPublicEpisode(
      sheetRow("fora-evan-frank", {
        ...PREFILLED_LINKS,
        published: false,
      })
    ),
    false
  );
});

test("an RSS episode stays public when the sheet listen cells are empty", () => {
  assert.equal(
    isPublicEpisode({
      slug: "rotten-michael-fisher",
      published: true,
      spotify: null,
      youtube: null,
      apple: null,
      website: "eatrotten.com",
    }),
    true
  );
});

test("dropping not-yet-live rows does not renumber episodes already assigned", () => {
  const newest = sheetRow("running-wylder-katie-douglas", {
    spotify: "https://open.spotify.com/episode/7mwmT8KnUMYgBpJfkueXic",
    youtube: "https://youtu.be/8qpzuJvuoto",
    apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735?i=1000799793965",
    published: true,
  });
  const upcoming = sheetRow("blake-mycoskie", PREFILLED_LINKS);
  const older = sheetRow("craighill-zach-fried", {
    spotify: "https://open.spotify.com/episode/7ev7LQodbBdFp1SAplFrhp",
    published: true,
  });
  const episodes = [newest, upcoming, older];
  const numbers = assignEpisodeNumbers(
    episodes,
    episodes.map((episode) => episode.slug)
  );
  for (const episode of episodes) episode.id = numbers.get(episode.slug);

  const listed = episodes.filter(isPublicEpisode);

  assert.deepEqual(
    listed.map((episode) => episode.slug),
    ["running-wylder-katie-douglas", "craighill-zach-fried"]
  );
  assert.equal(newest.id, 3);
  assert.equal(older.id, 1);
  assert.equal(upcoming.published, false);
  assert.equal(listed[0].spotify, newest.spotify);
  assert.equal(listed[0].youtube, newest.youtube);
  assert.equal(listed[0].apple, newest.apple);
});
