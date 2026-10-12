const test = require("node:test");
const assert = require("node:assert/strict");
const data = require("../data/topic-tags.json");
const { topicTagsForEpisode, allTopics, topicBySlug } = require("../src/lib/topics");

const MIKEY = "mikeys-pies-mikey-deegan";

test("every published episode has two to four known topics", () => {
  assert.ok(data.topics.length >= 12 && data.topics.length <= 20);
  const known = new Set(data.topics.map((topic) => topic.slug));
  const slugs = new Set();
  const used = new Map(data.topics.map((topic) => [topic.slug, 0]));

  for (const episode of data.episodes) {
    assert.ok(episode.slug);
    assert.ok(episode.brand);
    assert.equal(slugs.has(episode.slug), false);
    slugs.add(episode.slug);
    assert.ok(episode.tags.length >= 2 && episode.tags.length <= 4);
    for (const tag of episode.tags) {
      assert.ok(known.has(tag), tag);
      used.set(tag, used.get(tag) + 1);
    }
    assert.deepEqual(
      topicTagsForEpisode(episode.slug).map((tag) => tag.slug),
      episode.tags
    );
  }

  assert.equal(data.episodes.length, 65);
  for (const [slug, count] of used) {
    assert.ok(count > 0, slug);
  }
  assert.deepEqual(
    topicTagsForEpisode(MIKEY).map((tag) => tag.label),
    ["Manufacturing", "Pricing & Margins", "Growth Without Ads"]
  );
  assert.deepEqual(topicTagsForEpisode("not-an-episode"), []);

  const manufacturing = topicBySlug("manufacturing");
  assert.ok(manufacturing.episodeSlugs.includes(MIKEY));
  assert.equal(allTopics().length, data.topics.length);
  assert.ok(allTopics().every((topic) => topic.episodeSlugs.length === used.get(topic.slug)));
});
