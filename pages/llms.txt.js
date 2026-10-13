const { fetchEpisodeDirectory } = require("../src/lib/fetchEpisodes");
const { buildLlmsTxt } = require("../src/lib/llms");

export default function LlmsTxt() {
  // getServerSideProps writes the plain-text response.
}

export async function getServerSideProps({ res }) {
  let episodes = [];
  try {
    episodes = await fetchEpisodeDirectory();
  } catch (err) {
    console.error("llms.txt episode fetch failed:", err.message);
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=900, stale-while-revalidate"
  );
  res.write(buildLlmsTxt(episodes));
  res.end();

  return { props: {} };
}
