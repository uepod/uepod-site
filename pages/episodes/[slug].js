import { useState } from "react";
import Head from "next/head";
import SiteChrome from "../../src/components/SiteChrome";
import { fetchEpisodeDirectory } from "../../src/lib/fetchEpisodes";
import { loadRelatedSources } from "../../src/lib/relatedSources";
import {
  listenOptions,
  normalizeWebsite,
  websiteLabel,
  formatEpisodeNumber,
  artworkAlt,
  relatedEpisodes,
  pageTitle,
  metaDescription,
  canonicalUrl,
  shareImage,
  jsonLdScript,
  episodePath,
} from "../../src/lib/episodePage";
import { topicTagsForEpisode } from "../../src/lib/topics";
import { shortTermName, termsForEpisode } from "../../src/lib/glossary";
import { categoryPath } from "../../src/lib/categories";
import { withFrom } from "../../src/lib/fromLink";
import BackLink from "../../src/components/BackLink";
import SponsorRead from "../../src/components/SponsorRead";
import { trackListenClick } from "../../src/lib/listenTracking";
import { descriptionBlocksForPage } from "../../src/lib/sponsorRead";

const REVALIDATE_SECONDS = 900;

function trackEvent(eventName, params = {}) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

const EMBED_ALLOW =
  "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
const YOUTUBE_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

function ListenEmbed({ option }) {
  return (
    <div className={option.video ? "listen-frame listen-frame-video" : "listen-frame"}>
      <iframe
        src={option.src}
        title={option.title}
        height={option.video ? undefined : option.height}
        allow={option.video ? YOUTUBE_ALLOW : EMBED_ALLOW}
        sandbox={option.sandbox}
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

function ListenTabs({ options, slug }) {
  const [active, setActive] = useState(options[0].key);
  const current = options.find((option) => option.key === active) || options[0];

  return (
    <section className="listen-section">
      <h2>Listen</h2>
      {options.length > 1 ? (
        <div className="listen-tabs" role="tablist" aria-label="Listen">
          {options.map((option) => {
            const selected = option.key === current.key;
            return (
              <button
                key={option.key}
                type="button"
                role="tab"
                id={`listen-tab-${option.key}`}
                aria-selected={selected}
                aria-controls="listen-panel"
                className="listen-tab"
                onClick={() => {
                  setActive(option.key);
                  trackListenClick(option.key, slug);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <div
        role="tabpanel"
        id="listen-panel"
        aria-labelledby={`listen-tab-${current.key}`}
      >
        <ListenEmbed key={current.src} option={current} />
      </div>
    </section>
  );
}

function ListenSection({ episode }) {
  const options = listenOptions(episode);
  if (!options.length) return null;
  return <ListenTabs options={options} slug={episode.slug} />;
}

function RelatedWords({ text }) {
  const parts = String(text || "").split(/(\s+)/);
  return parts.map((part, index) =>
    part.trim() ? (
      <span key={`${index}-${part}`} className="related-word">
        {part}
      </span>
    ) : (
      part
    )
  );
}

function relatedGuestLines(guest) {
  const text = String(guest || "").trim();
  if (!text.includes("&")) return text ? [text] : [];
  const parts = text.split("&");
  const lines = [];
  parts.forEach((part, index) => {
    const name = part.trim();
    if (!name) return;
    lines.push(index < parts.length - 1 ? `${name} &` : name);
  });
  return lines.length ? lines : [text];
}

function RelatedRow({ episode, fromPath, fromName }) {
  const number = formatEpisodeNumber(episode.id);
  const guestLines = relatedGuestLines(episode.guest);

  return (
    <div className="related-link">
      <a
        className="related-card-link"
        href={withFrom(episodePath(episode.slug), fromPath, fromName)}
        aria-label={episode.brand || episode.title || "Episode"}
      />
      <div
        className="episode-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "64px 1fr auto",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div
          className="episode-number"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "12px",
            color: "rgba(255,255,255,0.6)",
            paddingTop: "4px",
            letterSpacing: "0.05em",
          }}
        >
          {number}
        </div>

        <div>
          {episode.category ? (
            <a
              className="category-label"
              href={withFrom(categoryPath(episode.category), fromPath, fromName)}
              style={{
                display: "inline-block",
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "6px",
              }}
            >
              {episode.category}
            </a>
          ) : null}

          <h3
            style={{
              fontFamily: '"AkkuratLLWeb-Bold", sans-serif',
              fontSize: "22px",
              lineHeight: 1.25,
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            <a
              className="related-clamp"
              href={withFrom(episodePath(episode.slug), fromPath, fromName)}
              title={episode.brand || episode.title || ""}
            >
              <RelatedWords text={episode.brand || episode.title} />
            </a>
          </h3>

          {guestLines.length ? (
            <a
              className="related-guest related-clamp"
              href={withFrom(episodePath(episode.slug), fromPath, fromName)}
              title={episode.guest || ""}
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "15px",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 400,
                lineHeight: 1.35,
              }}
            >
              {guestLines.map((line, index) => (
                <span key={line}>
                  {index > 0 ? <br /> : null}
                  <RelatedWords text={line} />
                </span>
              ))}
            </a>
          ) : null}

          <div
            className="episode-meta-inline"
            style={{
              display: "none",
              gap: "12px",
              marginTop: "10px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "11px",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {episode.date ? <span>{episode.date}</span> : null}
            {episode.duration ? <span>{episode.duration}</span> : null}
          </div>
        </div>

        <div
          className="episode-meta"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "12px",
            color: "rgba(255,255,255,0.6)",
            textAlign: "right",
            whiteSpace: "nowrap",
            paddingTop: "4px",
          }}
        >
          {episode.date ? <div>{episode.date}</div> : null}
          {episode.duration ? (
            <div style={{ marginTop: "4px" }}>{episode.duration}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function EpisodePage({ episode, related, terms = [] }) {
  const title = pageTitle(episode);
  const description = metaDescription(episode);
  const canonical = canonicalUrl(episode.slug);
  const image = shareImage(episode);
  const alt = artworkAlt(episode);
  const blocks = descriptionBlocksForPage(episode);
  const websiteHref = normalizeWebsite(episode.website);
  const siteLabel = websiteLabel(episode.website);
  const episodeNumber = formatEpisodeNumber(episode.id);
  const whenBits = [episode.date, episode.duration].filter(Boolean);
  const topicTags = topicTagsForEpisode(episode.slug);
  const fromPath = `/episodes/${episode.slug}`;
  const fromName = episode.brand || episode.title || "this episode";
  const jsonLd = jsonLdScript(episode);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow" />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={image} />
        <meta property="og:image:alt" content={alt} />
        <meta property="og:site_name" content="Unit Economics" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <meta name="twitter:image:alt" content={alt} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      </Head>

      <SiteChrome>
        <article className="content-section episode-page">
          <div className="episode-kicker">
            <BackLink />
            {episodeNumber ? <span>{episodeNumber}</span> : null}
            {episode.category ? (
              <a className="episode-category" href={withFrom(categoryPath(episode.category), fromPath, fromName)}>
                {episode.category}
              </a>
            ) : null}
          </div>

          <header className="episode-header">
            <h1
              style={{
                fontFamily: '"AkkuratLLWeb-Bold", sans-serif',
                fontSize: "clamp(32px, 4vw, 56px)",
                lineHeight: 1.05,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                fontWeight: 400,
                margin: 0,
              }}
            >
              {episode.brand || episode.title}
            </h1>

            {episode.guest ? (
              <div
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "18px",
                  color: "rgba(255,255,255,0.75)",
                  marginTop: "10px",
                  fontWeight: 400,
                }}
              >
                {episode.linkedin ? (
                  <a
                    className="episode-guest-link"
                    href={episode.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {episode.guest}
                  </a>
                ) : (
                  episode.guest
                )}
              </div>
            ) : null}

            {websiteHref && siteLabel ? (
              <a
                className="episode-website"
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent("episode_website_click", {
                    episode_name: episode.brand,
                  })
                }
              >
                {siteLabel}
              </a>
            ) : null}

            {whenBits.length ? (
              <div
                className="episode-when"
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                  letterSpacing: "0.04em",
                }}
              >
                {whenBits.map((bit) => (
                  <span key={bit}>{bit}</span>
                ))}
              </div>
            ) : null}

            {topicTags.length ? (
              <p className="episode-terms">
                <span className="episode-terms-label">Topics</span>
                {topicTags.map((tag, index) => (
                  <span key={tag.slug}>
                    {index > 0 ? <span className="episode-terms-sep">, </span> : null}
                    <a href={withFrom(`/topics/${tag.slug}`, fromPath, fromName)}>{tag.label}</a>
                  </span>
                ))}
              </p>
            ) : null}

            {terms.length ? (
              <p className="episode-terms">
                <span className="episode-terms-label">Terms in this episode</span>
                {terms.map((term, index) => (
                  <span key={term.anchor}>
                    {index > 0 ? <span className="episode-terms-sep">, </span> : null}
                    <a href={`/glossary#${term.anchor}`}>{shortTermName(term.term)}</a>
                  </span>
                ))}
              </p>
            ) : null}
          </header>

          <ListenSection episode={episode} />

          <div className="episode-description">
            <h2>About</h2>
            {blocks.map((parts, index) => (
              <p key={index}>
                {parts.map((part, partIndex) =>
                  part.href ? (
                    <a
                      key={partIndex}
                      className="episode-guest-link"
                      href={part.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {part.text}
                    </a>
                  ) : (
                    <span key={partIndex}>{part.text}</span>
                  )
                )}
              </p>
            ))}
            <SponsorRead />
          </div>

          {episode.takeaways?.length ? (
            <section className="episode-takeaways">
              <h2>Key takeaways</h2>
              <ul>
                {episode.takeaways.map((takeaway, index) => (
                  <li key={`${index}-${takeaway}`}>{takeaway}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {related.length ? (
            <section className="episode-related">
              <h2>Related</h2>
              <div className="related-list">
                {related.map((item) => (
                  <RelatedRow
                    key={item.slug}
                    episode={item}
                    fromPath={fromPath}
                    fromName={fromName}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <a className="back-link episode-back-bottom" href="/#episodes">
            All episodes →
          </a>
        </article>
      </SiteChrome>
    </>
  );
}

function slimEpisode(episode) {
  return {
    slug: episode.slug,
    title: episode.title || "",
    brand: episode.brand || "",
    guest: episode.guest || "",
    category: episode.category || "",
    date: episode.date || "",
    duration: episode.duration || "",
    id: episode.id ?? null,
  };
}

export async function getStaticPaths() {
  try {
    const episodes = await fetchEpisodeDirectory();
    return {
      paths: episodes
        .filter((episode) => episode.slug)
        .map((episode) => ({ params: { slug: episode.slug } })),
      fallback: "blocking",
    };
  } catch (err) {
    console.error("Episode paths unavailable:", err.message);
    return { paths: [], fallback: "blocking" };
  }
}

export async function getStaticProps({ params }) {
  const slug = params?.slug;
  const episodes = await fetchEpisodeDirectory();
  const episode = episodes.find((item) => item.slug === slug);

  if (!episode) {
    return { notFound: true, revalidate: REVALIDATE_SECONDS };
  }

  const related = relatedEpisodes(episodes, episode, 3, loadRelatedSources()).map(
    slimEpisode
  );

  return {
    props: {
      episode: JSON.parse(JSON.stringify(episode)),
      related: JSON.parse(JSON.stringify(related)),
      terms: termsForEpisode(episode.slug),
    },
    revalidate: REVALIDATE_SECONDS,
  };
}
