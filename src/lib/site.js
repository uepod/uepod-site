/**
 * Shared show facts. Homepage copy, listen links, the RSS feed, /llms.txt,
 * and the homepage series object all read these so a new episode or a URL
 * change does not need a second edit.
 */

const SITE_URL = "https://uepod.com";
const RSS_URL = "https://anchor.fm/s/10a3f3bac/podcast/rss";
const HOST_NAME = "Josh Stabinsky";
const HOMEPAGE_DESCRIPTION =
  "A podcast about how businesses actually work, featuring conversations with founders, operators, and investors about the decisions, economics, constraints, and tradeoffs behind the scenes.";

const SHOW_URLS = {
  spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F",
  apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735",
  youtube: "https://www.youtube.com/@TheUnitEconomicsPodcast",
  substack: "https://uepod.substack.com/",
};

const SUBSTACK_URL = SHOW_URLS.substack;

function wwwOrigin(siteUrl) {
  const url = new URL(siteUrl);
  if (!url.hostname.startsWith("www.")) {
    url.hostname = `www.${url.hostname}`;
  }
  return url.origin;
}

/** Links written for readers use the www host. Canonical tags stay on SITE_URL. */
const PUBLIC_SITE_URL = wwwOrigin(SITE_URL);

function buildPodcastSeriesJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: "Unit Economics",
    description: HOMEPAGE_DESCRIPTION,
    url: PUBLIC_SITE_URL,
    author: { "@type": "Person", name: HOST_NAME },
    host: { "@type": "Person", name: HOST_NAME },
    webFeed: RSS_URL,
    sameAs: [
      SHOW_URLS.spotify,
      SHOW_URLS.apple,
      SHOW_URLS.youtube,
      SHOW_URLS.substack,
    ],
  };
}

function podcastSeriesJsonLdScript() {
  return JSON.stringify(buildPodcastSeriesJsonLd()).replace(/</g, "\\u003c");
}

module.exports = {
  SITE_URL,
  PUBLIC_SITE_URL,
  RSS_URL,
  HOST_NAME,
  HOMEPAGE_DESCRIPTION,
  SHOW_URLS,
  SUBSTACK_URL,
  buildPodcastSeriesJsonLd,
  podcastSeriesJsonLdScript,
};
