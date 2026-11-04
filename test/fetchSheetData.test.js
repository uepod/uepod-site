const test = require("node:test");
const assert = require("node:assert/strict");

const {
  fetchSheetData,
  parseSheetCsv,
  SheetUnavailableError,
} = require("../src/lib/fetchSheetData");

const CSV = [
  "slug,brand,category,spotify",
  "springdale-ventures-dan-graham-mollye-santulli,Springdale Ventures,Venture Capital,https://open.spotify.com/episode/abc",
  "one-trick-pony-lucy-dana,One Trick Pony,Food & Beverage,https://open.spotify.com/episode/def",
].join("\n");

test("parses sheet rows keyed by slug", () => {
  const rows = parseSheetCsv(CSV);
  assert.equal(
    rows["springdale-ventures-dan-graham-mollye-santulli"].category,
    "Venture Capital"
  );
  assert.equal(Object.keys(rows).length, 2);
});

test("ignores a non-csv body", () => {
  assert.deepEqual(parseSheetCsv("<html>sign in</html>"), {});
});

test("uses the live sheet when it has rows", async () => {
  let calls = 0;
  const rows = await fetchSheetData({
    url: "https://sheet.example/live",
    async request() {
      calls += 1;
      return CSV;
    },
    readSnapshot() {
      throw new Error("snapshot should not be read");
    },
  });
  assert.equal(calls, 1);
  assert.equal(
    rows["springdale-ventures-dan-graham-mollye-santulli"].category,
    "Venture Capital"
  );
});

test("retries the live fetch once, then uses the snapshot", async () => {
  const calls = [];
  const rows = await fetchSheetData({
    url: "https://127.0.0.1:9/sheet",
    async request(url) {
      calls.push(url);
      throw new Error("connect ECONNREFUSED");
    },
    readSnapshot() {
      return CSV;
    },
  });
  assert.deepEqual(calls, [
    "https://127.0.0.1:9/sheet",
    "https://127.0.0.1:9/sheet",
  ]);
  assert.equal(
    rows["springdale-ventures-dan-graham-mollye-santulli"].spotify,
    "https://open.spotify.com/episode/abc"
  );
});

test("falls back when the live response has no rows", async () => {
  const rows = await fetchSheetData({
    async request() {
      return "not,a,sheet\n1,2,3";
    },
    readSnapshot() {
      return CSV;
    },
  });
  assert.equal(Object.keys(rows).length, 2);
});

test("throws when the live fetch and the snapshot both have no rows", async () => {
  await assert.rejects(
    () =>
      fetchSheetData({
        async request() {
          throw new Error("timed out");
        },
        readSnapshot() {
          return "";
        },
      }),
    (err) => {
      assert.equal(err instanceof SheetUnavailableError, true);
      assert.equal(err.sheetUnavailable, true);
      return true;
    }
  );
});
