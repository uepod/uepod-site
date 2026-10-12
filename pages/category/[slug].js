import Head from "next/head";
import SiteChrome from "../../src/components/SiteChrome";
import EpisodeCard from "../../src/components/EpisodeCard";
import BackLink from "../../src/components/BackLink";
import { fetchEpisodeDirectory } from "../../src/lib/fetchEpisodes";
import { SITE_URL } from "../../src/lib/episodePage";
import { categorySlug } from "../../src/lib/categories";

const REVALIDATE_SECONDS = 900;

export default function CategoryPage({ category, episodes }) {
  const fromPath = `/category/${category.slug}`;
  const fromName = category.label;
  const title = `${category.label} | Unit Economics`;
  const description = `Episodes in ${category.label}.`;
  const canonical = `${SITE_URL}/category/${category.slug}`;

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
              fontSize: "clamp(32px, 4vw, 48px)",
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              fontWeight: 400,
              margin: "28px 0 0",
            }}
          >
            {category.label}
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
  let directory = [];
  try {
    directory = await fetchEpisodeDirectory();
  } catch (err) {
    console.error("Category paths unavailable:", err.message);
  }

  const slugs = new Set();
  for (const episode of directory) {
    const slug = categorySlug(episode.category);
    if (slug) slugs.add(slug);
  }

  return {
    paths: [...slugs].map((slug) => ({ params: { slug } })),
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const slug = params?.slug || "";
  let directory = [];
  try {
    directory = await fetchEpisodeDirectory();
  } catch (err) {
    console.error("Category episode lookup failed:", err.message);
  }

  const episodes = directory
    .filter((episode) => categorySlug(episode.category) === slug)
    .map(slimEpisode);

  if (!episodes.length) {
    return { notFound: true, revalidate: REVALIDATE_SECONDS };
  }

  return {
    props: {
      category: { slug, label: episodes[0].category },
      episodes,
    },
    revalidate: REVALIDATE_SECONDS,
  };
}
