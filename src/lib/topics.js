/**
 * Topic tags for published episodes. data/topic-tags.json is the review list.
 * Mikey's Pies stays Manufacturing, Pricing & Margins, Growth Without Ads.
 */

const data = require("../../data/topic-tags.json");

const TOPICS = data.topics;

function topicTagsForEpisode(slug) {
  const record = (data.episodes || []).find((episode) => episode.slug === slug);
  if (!record) return [];
  const bySlug = new Map(TOPICS.map((topic) => [topic.slug, topic]));
  return (record.tags || [])
    .map((topicSlug) => {
      const topic = bySlug.get(topicSlug);
      return topic ? { slug: topic.slug, label: topic.label } : null;
    })
    .filter(Boolean);
}

function episodeSlugsForTopic(topicSlug) {
  return (data.episodes || [])
    .filter((episode) => (episode.tags || []).includes(topicSlug))
    .map((episode) => episode.slug);
}

function topicBySlug(slug) {
  const topic = TOPICS.find((item) => item.slug === slug);
  if (!topic) return null;
  return {
    slug: topic.slug,
    label: topic.label,
    episodeSlugs: episodeSlugsForTopic(topic.slug),
  };
}

function allTopics() {
  return TOPICS.map((topic) => ({
    slug: topic.slug,
    label: topic.label,
    episodeSlugs: episodeSlugsForTopic(topic.slug),
  }));
}

module.exports = {
  topicTagsForEpisode,
  topicBySlug,
  allTopics,
};
