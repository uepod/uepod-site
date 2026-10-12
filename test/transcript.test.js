const test = require("node:test");
const assert = require("node:assert/strict");
const { parseTranscript, loadEpisodeTranscript } = require("../src/lib/transcript");

test("speaker turns join wrapped lines and drop timestamps", () => {
  const turns = parseTranscript(
    [
      "Josh (00:00)",
      "Hello",
      "",
      "there. Second sentence.",
      "",
      "Mikey Deegan (00:07)",
      "Yeah.",
    ].join("\n")
  );
  assert.deepEqual(turns, [
    { speaker: "Josh", paragraphs: ["Hello there. Second sentence."] },
    { speaker: "Mikey Deegan", paragraphs: ["Yeah."] },
  ]);
});

test("the show name is corrected and other wording stays", () => {
  const turns = parseTranscript("Mikey Deegan (00:07)\nback to Union Economics and field industry.\n");
  assert.equal(turns[0].paragraphs[0], "back to Unit Economics and field industry.");
});

test("only Mikey's Pies loads a transcript", () => {
  const turns = loadEpisodeTranscript("mikeys-pies-mikey-deegan");
  assert.equal(turns.filter((turn) => turn.speaker === "Josh").length, 52);
  assert.equal(turns.filter((turn) => turn.speaker === "Mikey Deegan").length, 51);
  const text = turns.map((turn) => turn.paragraphs.join(" ")).join("\n");
  assert.match(text, /Unit Economics/);
  assert.doesNotMatch(text, /Union Economics/);
  assert.doesNotMatch(text, /\(\d{2}:\d{2}\)/);
  assert.deepEqual(loadEpisodeTranscript("someone-else"), []);
});
