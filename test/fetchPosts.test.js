const test = require("node:test");
const assert = require("node:assert/strict");

const { isPodcastEpisode } = require("../src/lib/fetchPosts");

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
