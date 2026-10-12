import Head from "next/head";
import SiteChrome from "../../src/components/SiteChrome";
import { fetchEpisodeDirectory } from "../../src/lib/fetchEpisodes";
import { SITE_URL, formatEpisodeNumber } from "../../src/lib/episodePage";
import { allTopics, topicBySlug } from "../../src/lib/topics";

const REVALIDATE_SECONDS = 900;

function TopicEpisode({ episode }) {
  const number = formatEpisodeNumber(episode.id);

  return (
    <div
      className="episode-grid"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "28px 0",
        display: "grid",
        gridTemplateColumns: "64px 1fr auto",
        gap: "20px",
        alignItems: "start",
      }}
    >
      <div
        className="episode-number"
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

        <h2
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
            href={`/episodes/${episode.slug}`}
            style={{ color: "#fff", textDecoration: "none" }}
          >
            {episode.brand || episode.title}
          </a>
        </h2>

        {episode.guest ? (
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "15px",
              color: "rgba(255,255,255,0.5)",
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
  );
}

export default function TopicPage({ topic, episodes }) {
  const title = `${topic.label} | Unit Economics`;
  const description = `Episodes tagged ${topic.label}.`;
  const canonical = `${SITE_URL}/topics/${topic.slug}`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>
      <SiteChrome>
        <article className="content-section topic-page">
          <a className="back-link" href="/#episodes">
            ← All episodes
          </a>
          <h1
            style={{
              fontFamily: '"AkkuratLLWeb-Bold", sans-serif',
              fontSize: "clamp(32px, 4vw, 56px)",
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              fontWeight: 400,
              margin: "28px 0 8px",
            }}
          >
            {topic.label}
          </h1>
          <div>
            {episodes.map((episode) => (
              <TopicEpisode key={episode.slug} episode={episode} />
            ))}
          </div>
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
  return {
    paths: allTopics().map((topic) => ({ params: { slug: topic.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const topic = topicBySlug(params?.slug);
  if (!topic) return { notFound: true };

  let directory = [];
  try {
    directory = await fetchEpisodeDirectory();
  } catch (err) {
    console.error("Topic episode lookup failed:", err.message);
  }

  const bySlug = new Map(directory.map((episode) => [episode.slug, episode]));
  const episodes = topic.episodeSlugs
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, 6)
    .map(slimEpisode);

  return {
    props: {
      topic: { slug: topic.slug, label: topic.label },
      episodes,
    },
    revalidate: REVALIDATE_SECONDS,
  };
}
