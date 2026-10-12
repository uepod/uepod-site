import { useEffect } from "react";
import Head from "next/head";
import SiteChrome from "../src/components/SiteChrome";
import { fetchEpisodeDirectory } from "../src/lib/fetchEpisodes";
import {
  GLOSSARY_DESCRIPTION,
  expandGlossary,
  prepareGlossary,
  heardInLabel,
  glossaryJsonLdScript,
} from "../src/lib/glossary";
import { SITE_URL } from "../src/lib/episodePage";
import glossarySource from "../data/glossary.json";

const CANONICAL = `${SITE_URL}/glossary`;
const TITLE = "Glossary | Unit Economics";

function letterDomId(letter) {
  return letter === "#" ? "letter-num" : `letter-${letter}`;
}

function scrollToId(id) {
  const scroller = document.querySelector(".site-scroll");
  const target = document.getElementById(id);
  if (!scroller || !target) return;
  const bar = document.querySelector(".glossary-letters");
  const barHeight = bar ? bar.getBoundingClientRect().height : 0;
  const top =
    target.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop -
    barHeight -
    8;
  scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export default function GlossaryPage({ groups, letters, terms }) {
  const present = new Set(groups.map((group) => group.letter));
  const jsonLd = glossaryJsonLdScript(terms);

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const frame = requestAnimationFrame(() => scrollToId(id));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={GLOSSARY_DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta name="robots" content="index, follow" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={GLOSSARY_DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:site_name" content="Unit Economics" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={GLOSSARY_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      </Head>
      <SiteChrome>
        <div className="glossary-page">
          <p className="glossary-kicker">Reference</p>
          <h1>Glossary</h1>
          <p className="glossary-intro">{GLOSSARY_DESCRIPTION}</p>

          <nav className="glossary-letters" aria-label="Letters">
            {letters.map((letter) =>
              present.has(letter) ? (
                <a
                  key={letter}
                  href={`#${letterDomId(letter)}`}
                  onClick={(event) => {
                    if (
                      event.button !== 0 ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    ) {
                      return;
                    }
                    event.preventDefault();
                    const id = letterDomId(letter);
                    scrollToId(id);
                    history.replaceState(null, "", `#${id}`);
                  }}
                >
                  {letter}
                </a>
              ) : (
                <span key={letter} aria-hidden="true">
                  {letter}
                </span>
              )
            )}
          </nav>

          {groups.map((group) => (
            <section
              key={group.letter}
              id={letterDomId(group.letter)}
              className="glossary-group"
              aria-labelledby={`${letterDomId(group.letter)}-heading`}
            >
              <h2 id={`${letterDomId(group.letter)}-heading`}>{group.letter}</h2>
              {group.terms.map((term) => (
                <article key={term.anchor} id={term.anchor} className="glossary-term">
                  <h3>{term.term}</h3>
                  {term.aliases.length > 0 ? (
                    <p className="glossary-aliases">Also called {term.aliases.join(", ")}</p>
                  ) : null}
                  <p className="glossary-definition">{term.definition}</p>
                  {term.related?.length ? (
                    <p className="glossary-related">
                      <span>Related</span>
                      {term.related.map((item) => (
                        <a
                          key={item.anchor}
                          href={`#${item.anchor}`}
                          onClick={(event) => {
                            if (
                              event.button !== 0 ||
                              event.metaKey ||
                              event.ctrlKey ||
                              event.shiftKey ||
                              event.altKey
                            ) {
                              return;
                            }
                            event.preventDefault();
                            scrollToId(item.anchor);
                            history.replaceState(null, "", `#${item.anchor}`);
                          }}
                        >
                          {item.name}
                        </a>
                      ))}
                    </p>
                  ) : null}
                  {term.episodes.length > 0 ? (
                    <p className="glossary-heard">
                      <span>Heard in</span>
                      {term.episodes.map((episode) => (
                        <a key={episode.slug} href={`/episodes/${episode.slug}`}>
                          {heardInLabel(episode) || episode.slug}
                        </a>
                      ))}
                    </p>
                  ) : null}
                </article>
              ))}
            </section>
          ))}
          <a
            className="back-link glossary-top"
            href="#top"
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }
              event.preventDefault();
              const scroller = document.querySelector(".site-scroll");
              if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            ↑ Top
          </a>
        </div>
      </SiteChrome>
    </>
  );
}

export async function getStaticProps() {
  let directory = [];
  try {
    directory = await fetchEpisodeDirectory();
  } catch (err) {
    console.error("Glossary episode lookup failed:", err.message);
  }

  const prepared = prepareGlossary(expandGlossary(glossarySource, directory));
  return {
    props: {
      groups: prepared.groups,
      letters: prepared.letters,
      terms: prepared.terms.map(({ letter, ...term }) => term),
    },
    revalidate: 900,
  };
}
