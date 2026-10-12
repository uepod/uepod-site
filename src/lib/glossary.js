const { SITE_URL, formatEpisodeNumber } = require("./episodePage");

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const GLOSSARY_DESCRIPTION =
  "Plain-language definitions of the business terms heard on Unit Economics, with links to the episodes where they come up.";

function termLetter(term) {
  const ch = String(term || "")
    .trim()
    .charAt(0)
    .toUpperCase();
  return LETTERS.includes(ch) ? ch : "#";
}

function termAnchor(term) {
  const slug = String(term || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "term";
}

function uniqueAnchors(terms) {
  const seen = new Map();
  return terms.map((term) => {
    const base = termAnchor(term.term);
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  });
}

function directoryBySlug(episodes) {
  const map = new Map();
  for (const episode of episodes || []) {
    if (episode && episode.slug) map.set(episode.slug, episode);
  }
  return map;
}

function resolveEpisode(episode, known) {
  const slug = String(episode?.slug || "").trim();
  const match = slug && known ? known.get(slug) : null;
  let number = episode?.number;
  if (number === undefined) number = episode?.id;
  if (number === null || number === undefined || number === "") {
    number = match ? match.id : null;
  }
  const numeric = number === null || number === undefined || number === "" ? null : Number(number);
  let brand = episode?.brand;
  if (brand === null || brand === undefined || String(brand).trim() === "") {
    brand = (match?.title || match?.brand || "").trim();
  }
  return {
    slug,
    number: Number.isFinite(numeric) ? numeric : null,
    brand: String(brand || "").trim(),
  };
}

// data/glossary.json is the swap point. Drop in either full records
// (term, aliases, definition, category, episode_count, episodes) or
// compact rows ({ t, d, e: [[slug, number, brand]] }). Null episode
// numbers and brands are filled from the episode directory by slug.
function episodeList(entry) {
  if (Array.isArray(entry?.e)) return entry.e;
  if (Array.isArray(entry?.episodes)) return entry.episodes;
  return [];
}

function asEpisode(item) {
  if (Array.isArray(item)) {
    return { slug: item[0], number: item[1], brand: item[2] };
  }
  return item || {};
}

function expandGlossaryEntry(entry, known) {
  const term = String(entry?.t ?? entry?.term ?? "").trim();
  const definition = String(entry?.d ?? entry?.definition ?? "").trim();
  const aliasSource = Array.isArray(entry?.aliases)
    ? entry.aliases
    : Array.isArray(entry?.a)
      ? entry.a
      : [];
  const categoryValue = entry?.category ?? entry?.c ?? null;
  const seen = new Set();
  const episodes = [];
  for (const item of episodeList(entry)) {
    const resolved = resolveEpisode(asEpisode(item), known);
    if (!resolved.slug || seen.has(resolved.slug)) continue;
    seen.add(resolved.slug);
    episodes.push(resolved);
    if (episodes.length === 3) break;
  }
  return {
    term,
    aliases: aliasSource.map((alias) => String(alias).trim()).filter(Boolean),
    definition,
    category: categoryValue ? String(categoryValue) : null,
    episode_count: episodes.length,
    episodes,
  };
}

function expandGlossary(entries, episodes) {
  const known = directoryBySlug(episodes);
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => expandGlossaryEntry(entry, known))
    .filter((entry) => entry.term && entry.definition);
}

function prepareGlossary(entries) {
  const sorted = [...entries].sort((a, b) =>
    a.term.localeCompare(b.term, "en", { sensitivity: "base" })
  );
  const anchors = uniqueAnchors(sorted);
  const terms = sorted.map((entry, index) => ({
    ...entry,
    anchor: anchors[index],
    letter: termLetter(entry.term),
  }));
  const groups = [];
  for (const term of terms) {
    const last = groups[groups.length - 1];
    if (!last || last.letter !== term.letter) {
      groups.push({ letter: term.letter, terms: [term] });
    } else {
      last.terms.push(term);
    }
  }
  const letters = groups.map((group) => group.letter);
  return { terms, groups, letters };
}

function heardInLabel(episode) {
  const number = formatEpisodeNumber(episode?.number);
  const brand = String(episode?.brand || "").trim();
  return [number, brand].filter(Boolean).join(" ");
}

function glossaryJsonLd(terms) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Unit Economics Glossary",
    description: GLOSSARY_DESCRIPTION,
    url: `${SITE_URL}/glossary`,
    hasDefinedTerm: terms.map((term) => {
      const defined = {
        "@type": "DefinedTerm",
        name: term.term,
        description: term.definition,
        url: `${SITE_URL}/glossary#${term.anchor}`,
      };
      if (term.aliases?.length) defined.alternateName = term.aliases;
      return defined;
    }),
  };
}

function glossaryJsonLdScript(terms) {
  return JSON.stringify(glossaryJsonLd(terms)).replace(/</g, "\\u003c");
}

module.exports = {
  LETTERS,
  GLOSSARY_DESCRIPTION,
  termLetter,
  termAnchor,
  expandGlossary,
  prepareGlossary,
  heardInLabel,
  glossaryJsonLd,
  glossaryJsonLdScript,
};
