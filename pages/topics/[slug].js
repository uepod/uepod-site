import Head from "next/head";
import SiteChrome from "../../src/components/SiteChrome";
import EpisodeCard from "../../src/components/EpisodeCard";
import BackLink from "../../src/components/BackLink";
import { fetchEpisodeDirectory } from "../../src/lib/fetchEpisodes";
import { SITE_URL } from "../../src/lib/episodePage";
import { allTopics, topicBySlug } from "../../src/lib/topics";

const REVALIDATE_SECONDS = 900;

export default function TopicPage({ topic, episodes }) {
  const fromPath = `/topics/${topic.slug}`;
  const fromName = topic.label;
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
          <BackLink />
          <h1
            style={{
              fontFamily: '"AkkuratLLWeb-Bold", sans-serif',
              fontSize: "clamp(32px, 4vw, 56px)",
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              fontWeight: 400,
              margin: "28px 0 0",
            }}
          >
            {topic.label}
          </h1>
          <div className="listing-grid">
            {episodes.map((episode) => (
              <EpisodeCard
                key={episode.slug}
                episode={episode}
                fromPath={fromPath}
                fromName={fromName}
              />
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

  const wanted = new Set(topic.episodeSlugs);
  const episodes = directory
    .filter((episode) => episode.published && wanted.has(episode.slug))
    .map(slimEpisode);

  return {
    props: {
      topic: { slug: topic.slug, label: topic.label },
      episodes,
    },
    revalidate: REVALIDATE_SECONDS,
  };
}
