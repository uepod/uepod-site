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
    for (const episode of term.episodes) {
      assert.ok(episode.slug);
      assert.match(heardInLabel(episode), /^E\. \d+/);
    }
  }
  const ld = glossaryJsonLd(prepared.terms);
  assert.equal(ld["@type"], "DefinedTermSet");
  assert.equal(ld.hasDefinedTerm.length, prepared.terms.length);
});
