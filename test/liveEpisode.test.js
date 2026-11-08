const test = require("node:test");
const assert = require("node:assert/strict");

const { isPublicEpisode } = require("../src/lib/fetchEpisodes");
const { assignEpisodeNumbers } = require("../src/lib/episodePage");
const { SHOW_URLS } = require("../src/lib/site");

function sheetRow(slug, links = {}) {
  return {
    slug,
    spotify: null,
    youtube: null,
    apple: null,
    website: "guest.example",
    published: false,
    ...links,
  };
}

test("a sheet row with no listen links is not public", () => {
  const episode = sheetRow("blake-mycoskie", { website: "blakemycoskie.com" });
  assert.equal(isPublicEpisode(episode), false);
  assert.equal(isPublicEpisode(null), false);
  assert.equal(isPublicEpisode(undefined), false);
});

test("whitespace and the guest website do not publish an episode", () => {
  assert.equal(
    isPublicEpisode(
      sheetRow("fora-evan-frank", {
        spotify: " ",
        youtube: "",
        apple: "\n",
        website: "foratravel.com",
      })
    ),
    false
  );
});

test("any one of Spotify, YouTube, or Apple publishes a sheet row", () => {
  assert.equal(
    isPublicEpisode(sheetRow("one", { spotify: "https://open.spotify.com/episode/abc" })),
    true
  );
  assert.equal(
    isPublicEpisode(sheetRow("two", { youtube: "https://youtu.be/abc" })),
    true
  );
  assert.equal(
    isPublicEpisode(
      sheetRow("three", {
        apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735?i=1",
      })
    ),
    true
  );
});

test("an RSS episode stays public when the sheet listen cells are empty", () => {
  // The feed merge stores the show URL in that case. Rotten is live in the
  // RSS with empty sheet cells, so the page and the homepage listing stay.
  assert.equal(
    isPublicEpisode({
      slug: "rotten-michael-fisher",
      published: true,
      spotify: SHOW_URLS.spotify,
      youtube: SHOW_URLS.youtube,
      apple: SHOW_URLS.apple,
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
  const upcoming = sheetRow("blake-mycoskie");
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
  assert.equal(listed[0].spotify, newest.spotify);
  assert.equal(listed[0].youtube, newest.youtube);
  assert.equal(listed[0].apple, newest.apple);
});
