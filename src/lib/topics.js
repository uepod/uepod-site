/**
 * Mockup topic tags. Only Mikey's Pies is tagged.
 * Manufacturing also lists a few episodes whose copy is about making the product.
 */

const MIKEY_SLUG = "mikeys-pies-mikey-deegan";

const TOPICS = [
  {
    slug: "manufacturing",
    label: "Manufacturing",
    episodeSlugs: [
      MIKEY_SLUG,
      "alecs-ice-cream-alec-jaffe",
      "terra-kaffe-sahand-dilmaghani",
      "tofugo-caroline-dai",
      "spring-mulberry-kathryn-shah",
      "pf-candle-co-kristen-pumphrey-thomas-neuberger",
    ],
  },
  {
    slug: "pricing-margins",
    label: "Pricing & Margins",
    episodeSlugs: [MIKEY_SLUG],
  },
  {
    slug: "growth-without-ads",
    label: "Growth Without Ads",
    episodeSlugs: [MIKEY_SLUG],
  },
];

function topicTagsForEpisode(slug) {
  if (slug !== MIKEY_SLUG) return [];
  return TOPICS.map(({ slug: topicSlug, label }) => ({
    slug: topicSlug,
    label,
  }));
}

function topicBySlug(slug) {
  return TOPICS.find((topic) => topic.slug === slug) || null;
}

function allTopics() {
  return TOPICS;
}

module.exports = {
  topicTagsForEpisode,
  topicBySlug,
  allTopics,
};
