const test = require("node:test");
const assert = require("node:assert/strict");

const { assignEpisodeNumbers } = require("../src/lib/episodePage");

function episode(slug, rawDate) {
  return { slug, rawDate: rawDate || null };
}

test("a sheet episode missing from the RSS still keeps its number", () => {
  const sheet = [
    "primis-imports-damian-primis",
    "miracle-mama-whitney-rowell",
    "9-mini-interviews",
    "lil-tuffy",
    "kelly-bennett",
    "le-puzz-alistair-matthews-and-michael-hunter",
    "craighill-zach-fried",
  ];
  const rss = [
    episode("primis-imports-damian-primis", "2026-10-21T10:00:00Z"),
    episode("miracle-mama-whitney-rowell", "2026-10-14T10:00:00Z"),
    episode("9-mini-interviews", "2026-06-02T10:00:00Z"),
    episode("lil-tuffy", "2026-03-10T10:00:00Z"),
    episode("kelly-bennett", "2026-03-03T11:00:00Z"),
    episode("le-puzz-alistair-matthews-and-michael-hunter", "2025-11-12T11:00:00Z"),
  ];
  const numbers = assignEpisodeNumbers(
    rss.concat([episode("craighill-zach-fried")]),
    sheet
  );

  assert.equal(numbers.get("primis-imports-damian-primis"), 7);
  assert.equal(numbers.get("miracle-mama-whitney-rowell"), 6);
  assert.equal(numbers.get("9-mini-interviews"), 5);
  assert.equal(numbers.get("lil-tuffy"), 4);
  assert.equal(numbers.get("kelly-bennett"), 3);
  assert.equal(numbers.get("le-puzz-alistair-matthews-and-michael-hunter"), 2);
  assert.equal(numbers.get("craighill-zach-fried"), 1);
});

test("a new RSS episode that is not in the sheet yet gets the next number", () => {
  const sheet = ["miracle-mama-whitney-rowell", "craighill-zach-fried"];
  const episodes = [
    episode("primis-imports-damian-primis", "2026-10-21T10:00:00Z"),
    episode("miracle-mama-whitney-rowell", "2026-10-14T10:00:00Z"),
    episode("craighill-zach-fried"),
  ];
  const numbers = assignEpisodeNumbers(episodes, sheet);

  assert.equal(numbers.get("primis-imports-damian-primis"), 3);
  assert.equal(numbers.get("miracle-mama-whitney-rowell"), 2);
  assert.equal(numbers.get("craighill-zach-fried"), 1);
});

test("dropping a middle episode from the feed does not renumber the others", () => {
  const sheet = [
    "primis-imports-damian-primis",
    "9-mini-interviews",
    "craighill-zach-fried",
  ];
  const withGap = assignEpisodeNumbers(
    [
      episode("primis-imports-damian-primis", "2026-10-21T10:00:00Z"),
      episode("9-mini-interviews"),
      episode("craighill-zach-fried"),
    ],
    sheet
  );
  assert.equal(withGap.get("primis-imports-damian-primis"), 3);
  assert.equal(withGap.get("9-mini-interviews"), 2);
  assert.equal(withGap.get("craighill-zach-fried"), 1);
});
