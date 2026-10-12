const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  expandGlossary,
  prepareGlossary,
  heardInLabel,
  glossaryJsonLd,
  termLetter,
  termsForEpisode,
} = require("../src/lib/glossary");

test("null episode numbers and brands are filled from the directory", () => {
  const expanded = expandGlossary(
    [
      {
        t: "Contribution margin",
        d: "What is left after variable costs.",
        a: ["CM"],
        c: "Margins",
        e: [
          ["mikeys-pies-mikey-deegan", null, null],
          ["mikeys-pies-mikey-deegan", 12, "Duplicate"],
        ],
      },
    ],
    [{ slug: "mikeys-pies-mikey-deegan", id: 41, brand: "Mikey's Pies" }]
  );

  assert.equal(expanded.length, 1);
  assert.equal(expanded[0].term, "Contribution margin");
  assert.deepEqual(expanded[0].aliases, ["CM"]);
  assert.equal(expanded[0].category, "Margins");
  assert.equal(expanded[0].episode_count, 1);
  assert.deepEqual(expanded[0].episodes, [
    { slug: "mikeys-pies-mikey-deegan", number: 41, brand: "Mikey's Pies" },
  ]);
  assert.equal(heardInLabel(expanded[0].episodes[0]), "E. 41 Mikey's Pies");
});

test("a blank brand uses the episode title and only three episodes are kept", () => {
  const expanded = expandGlossary(
    [
      {
        t: "Email list",
        d: "People who agreed to get emails.",
        e: [
          ["kelly-bennett", 24, ""],
          ["a", 1, "A"],
          ["b", 2, "B"],
          ["c", 3, "C"],
        ],
      },
    ],
    [{ slug: "kelly-bennett", id: 24, brand: "Kelly Bennett", title: "Kelly Bennett" }]
  );
  assert.equal(expanded[0].episode_count, 3);
  assert.deepEqual(
    expanded[0].episodes.map((episode) => episode.slug),
    ["kelly-bennett", "a", "b"]
  );
  assert.equal(expanded[0].episodes[0].brand, "Kelly Bennett");
  assert.equal(heardInLabel(expanded[0].episodes[0]), "E. 24 Kelly Bennett");
});

test("terms group from A to Z and JSON-LD is a DefinedTermSet", () => {
  const prepared = prepareGlossary(
    expandGlossary(
      [
        { term: "Zed", definition: "Last.", episodes: [] },
        { term: "Alpha", definition: "First.", aliases: ["A"], episodes: [{ slug: "a", number: 2, brand: "Alpha Co" }] },
      ],
      []
    )
  );

  assert.deepEqual(
    prepared.groups.map((group) => group.letter),
    ["A", "Z"]
  );
  assert.deepEqual(prepared.letters, ["A", "Z"]);
  assert.equal(prepared.terms[0].anchor, "alpha");
  assert.equal(termLetter("3PL"), "#");

  const ld = glossaryJsonLd(prepared.terms);
  assert.equal(ld["@type"], "DefinedTermSet");
  assert.equal(ld.hasDefinedTerm.length, 2);
  assert.equal(ld.hasDefinedTerm[0].name, "Alpha");
  assert.equal(ld.hasDefinedTerm[0].url, "https://uepod.com/glossary#alpha");
  assert.deepEqual(ld.hasDefinedTerm[0].alternateName, ["A"]);
  assert.equal(ld.hasDefinedTerm[0].isRelatedTo, undefined);
});

test("related names link to glossary anchors and empty aliases stay off the term", () => {
  const prepared = prepareGlossary(
    expandGlossary(
      [
        { term: "CAC (customer acquisition cost)", definition: "Cost to win a customer.", aliases: [], related: ["LTV (lifetime value)", "Missing"] },
        { term: "LTV (lifetime value)", definition: "Value of a customer.", aliases: ["lifetime value"], related: [] },
      ],
      []
    )
  );
  const cac = prepared.terms.find((term) => term.term.startsWith("CAC"));
  assert.deepEqual(cac.aliases, []);
  assert.deepEqual(cac.related, [
    { name: "LTV (lifetime value)", anchor: "ltv-lifetime-value" },
  ]);
  const ld = glossaryJsonLd(prepared.terms).hasDefinedTerm.find((term) => term.name.startsWith("CAC"));
  assert.equal(ld.alternateName, undefined);
  assert.deepEqual(ld.isRelatedTo, [
    {
      "@type": "DefinedTerm",
      name: "LTV (lifetime value)",
      url: "https://uepod.com/glossary#ltv-lifetime-value",
    },
  ]);
});

test("committed glossary has a term, definition, and episode links", () => {
  const file = path.join(__dirname, "../data/glossary.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(data.length, 61);

  const prepared = prepareGlossary(expandGlossary(data, []));
  assert.equal(prepared.terms.length, 61);
  assert.deepEqual(
    prepared.letters,
    prepared.groups.map((group) => group.letter)
  );
  assert.equal(prepared.letters[0], "#");
  for (const term of prepared.terms) {
    assert.ok(term.term);
    assert.ok(term.definition);
    assert.equal(term.episode_count, term.episodes.length);
    assert.ok(term.episodes.length >= 1 && term.episodes.length <= 3);
    assert.ok(Array.isArray(term.aliases));
    assert.ok(Array.isArray(term.related));
    for (const item of term.related) {
      assert.ok(item.name);
      assert.ok(item.anchor);
    }
    for (const episode of term.episodes) {
      assert.ok(episode.slug);
      assert.match(heardInLabel(episode), /^E\. \d+/);
    }
  }
  const ld = glossaryJsonLd(prepared.terms);
  assert.equal(ld["@type"], "DefinedTermSet");
  assert.equal(ld.hasDefinedTerm.length, prepared.terms.length);
  for (const term of prepared.terms) {
    const defined = ld.hasDefinedTerm.find((item) => item.name === term.term);
    if (!term.related.length) assert.equal(defined.isRelatedTo, undefined);
    else assert.equal(defined.isRelatedTo.length, term.related.length);
  }
});

test("episode terms keep glossary anchors past the three-episode display cap", () => {
  const entries = [
    {
      term: "3PL (third-party logistics)",
      definition: "A company that stores and ships for you.",
      episodes: [
        { slug: "a", number: 1, brand: "A" },
        { slug: "b", number: 2, brand: "B" },
        { slug: "c", number: 3, brand: "C" },
        { slug: "mikeys-pies-mikey-deegan", number: 65, brand: "Mikey's Pies" },
      ],
    },
    {
      term: "Gross margin",
      definition: "What is left after the cost of goods.",
      episodes: [{ slug: "mikeys-pies-mikey-deegan", number: 65, brand: "Mikey's Pies" }],
    },
  ];
  const prepared = prepareGlossary(expandGlossary(entries));
  const terms = termsForEpisode("mikeys-pies-mikey-deegan", entries);
  assert.deepEqual(terms, [
    {
      term: "3PL (third-party logistics)",
      anchor: prepared.terms.find((term) => term.term.startsWith("3PL")).anchor,
    },
    {
      term: "Gross margin",
      anchor: prepared.terms.find((term) => term.term === "Gross margin").anchor,
    },
  ]);
  assert.equal(expandGlossary(entries)[0].episodes.length, 3);
  assert.deepEqual(termsForEpisode("missing", entries), []);
});
