import Head from "next/head";
import SiteChrome from "../src/components/SiteChrome";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page not found — Unit Economics</title>
        <meta name="robots" content="noindex" />
      </Head>
      <SiteChrome>
        <div
          className="content-section"
          style={{ padding: "80px 40px", maxWidth: "680px" }}
        >
          <h1
            style={{
              fontFamily: '"AkkuratLLWeb-Bold", sans-serif',
              fontSize: "clamp(32px, 4vw, 48px)",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              marginBottom: "20px",
              fontWeight: 400,
            }}
          >
            Page not found
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "15px",
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.45)",
              marginBottom: "28px",
            }}
          >
            That page isn’t on the site.
          </p>
          <a className="back-link" href="/#episodes">
            All episodes →
          </a>
        </div>
      </SiteChrome>
    </>
  );
}
