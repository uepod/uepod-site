import { useState } from "react";
import Head from "next/head";
import SiteChrome from "../../src/components/SiteChrome";
import {
  SpotifyIcon,
  AppleIcon,
  YouTubeIcon,
  SubstackIcon,
} from "../../src/components/icons";
import { fetchEpisodeDirectory } from "../../src/lib/fetchEpisodes";
import {
  SUBSTACK_URL,
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

const REVALIDATE_SECONDS = 900;

function trackEvent(eventName, params = {}) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

function PlatformButton({ href, hoverColor, icon: Icon, label, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 20px",
        border: `1px solid ${hovered ? hoverColor : "rgba(255,255,255,0.2)"}`,
        textDecoration: "none",
        color: hovered ? hoverColor : "#fff",
        fontSize: "13px",
        fontWeight: 500,
        letterSpacing: "0.04em",
        transition: "all 0.2s",
        fontFamily: "'Space Grotesk', sans-serif",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <Icon /> {label}
    </a>
  );
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

function ListenTabs({ options }) {
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
                onClick={() => setActive(option.key)}
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
  return <ListenTabs options={options} />;
}

function RelatedRow({ episode }) {
  const number = formatEpisodeNumber(episode.id);

  return (
    <a className="related-link" href={episodePath(episode.slug)}>
      <div
        className="episode-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "48px 1fr auto",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            color: "rgba(255,255,255,0.3)",
            paddingTop: "4px",
            letterSpacing: "0.05em",
          }}
        >
          {number}
        </div>

        <div>
          {episode.category ? (
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "6px",
              }}
            >
              {episode.category}
            </div>
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
            {episode.brand || episode.title}
          </h3>

          {episode.guest ? (
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "15px",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 400,
              }}
            >
              {episode.guest}
            </div>
          ) : null}

          <div
            className="episode-meta-inline"
            style={{
              display: "none",
              gap: "12px",
              marginTop: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            {episode.date ? <span>{episode.date}</span> : null}
            {episode.duration ? <span>{episode.duration}</span> : null}
          </div>
        </div>

        <div
          className="episode-meta"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            color: "rgba(255,255,255,0.25)",
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
    </a>
  );
}

export default function EpisodePage({ episode, related }) {
  const title = pageTitle(episode);
  const description = metaDescription(episode);
  const canonical = canonicalUrl(episode.slug);
  const image = shareImage(episode);
  const alt = artworkAlt(episode);
  const paragraphs = episode.descriptionParagraphs?.length
    ? episode.descriptionParagraphs
    : episode.desc
      ? [episode.desc]
      : [];
  const websiteHref = normalizeWebsite(episode.website);
  const siteLabel = websiteLabel(episode.website);
  const metaBits = [
    formatEpisodeNumber(episode.id),
    episode.date,
    episode.duration,
  ].filter(Boolean);
  const jsonLd = jsonLdScript(episode);

  const buttons = [
    episode.spotify
      ? {
          key: "spotify",
          href: episode.spotify,
          hoverColor: "#1DB954",
          icon: SpotifyIcon,
          label: "Spotify",
        }
      : null,
    episode.apple
      ? {
          key: "apple",
          href: episode.apple,
          hoverColor: "#9B59B6",
          icon: AppleIcon,
          label: "Apple Podcasts",
        }
      : null,
    episode.youtube
      ? {
          key: "youtube",
          href: episode.youtube,
          hoverColor: "#FF0000",
          icon: YouTubeIcon,
          label: "YouTube",
        }
      : null,
    {
      key: "substack",
      href: SUBSTACK_URL,
      hoverColor: "#FF6719",
      icon: SubstackIcon,
      label: "Substack",
    },
  ].filter(Boolean);

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
        <article
          className="content-section"
          style={{ padding: "48px 40px 80px" }}
        >
          <a className="back-link" href="/#episodes">
            ← All episodes
          </a>

          <header className="episode-header">
            <div>
              {episode.category ? (
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "10px",
                  }}
                >
                  {episode.category}
                </div>
              ) : null}

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
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "18px",
                    color: "rgba(255,255,255,0.5)",
                    marginTop: "10px",
                    fontWeight: 400,
                  }}
                >
                  {episode.guest}
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

              {metaBits.length ? (
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginTop: "16px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {metaBits.map((bit) => (
                    <span key={bit}>{bit}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </header>

          {paragraphs.length ? (
            <div className="episode-description">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          <ListenSection episode={episode} />

          <div
            className="platform-buttons"
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "28px",
              flexWrap: "wrap",
            }}
          >
            {buttons.map((button) => (
              <PlatformButton
                key={button.key}
                href={button.href}
                hoverColor={button.hoverColor}
                icon={button.icon}
                label={button.label}
                onClick={() =>
                  trackEvent("episode_platform_click", {
                    platform: button.key,
                    episode_name: episode.brand,
                  })
                }
              />
            ))}
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
              {related.map((item) => (
                <RelatedRow key={item.slug} episode={item} />
              ))}
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

  const related = relatedEpisodes(episodes, episode, 3).map(slimEpisode);

  return {
    props: {
      episode: JSON.parse(JSON.stringify(episode)),
      related: JSON.parse(JSON.stringify(related)),
    },
    revalidate: REVALIDATE_SECONDS,
  };
}
