const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { parseTranscript } = require("../src/lib/transcript");
const { cleanTranscript, leftoverRetakePhrases } = require("../src/lib/transcriptClean");

function spoken(raw) {
  return cleanTranscript(raw).turns.map((turn) => `${turn.speaker}: ${turn.paragraphs.join(" ")}`).join("\n");
}

test("scratch that drops the false start and keeps the next take", () => {
  const result = cleanTranscript(
    [
      "Guest (01:00)",
      "The margin is 10 percent. Scratch that.",
      "",
      "Guest (01:08)",
      "The margin is 12 percent.",
    ].join("\n")
  );
  assert.equal(spokenFrom(result), "Guest: The margin is 12 percent.");
  assert.equal(result.removals.length, 1);
  assert.equal(result.removals[0].timestamp, "01:00");
  assert.equal(leftoverRetakePhrases(spokenFrom(result)).length, 0);
});

test("a later take in the same turn replaces the false start", () => {
  const text = spoken(
    [
      "Guest (02:00)",
      "We opened in 2019. Let me say that again. We opened in 2020.",
    ].join("\n")
  );
  assert.equal(text, "Guest: We opened in 2020.");
});

test("a host retake request removes the previous take and keeps the clean one", () => {
  const text = spoken(
    [
      "Guest (03:00)",
      "The number is 10 million.",
      "",
      "Josh (03:04)",
      "Can we take that again?",
      "",
      "Guest (03:06)",
      "The number is 12 million.",
    ].join("\n")
  );
  assert.equal(text, "Guest: The number is 12 million.");
});

test("off the record removes the aside and keeps the resume", () => {
  const result = cleanTranscript(
    [
      "Guest (05:00)",
      "Off the record, the investor passed.",
      "",
      "Josh (05:12)",
      "Okay, back on the record. What about the margin?",
    ].join("\n")
  );
  assert.equal(spokenFrom(result), "Josh: What about the margin?");
  assert.equal(result.removals[0].uncertain, false);
  assert.equal(leftoverRetakePhrases(spokenFrom(result)).length, 0);
});

test("an unmarked off-the-record span is removed through the next question and flagged", () => {
  const result = cleanTranscript(
    [
      "Guest (06:00)",
      "Off the record, that hire did not work out.",
      "",
      "Guest (06:08)",
      "They left after a month.",
      "",
      "Josh (06:20)",
      "What did you change in the kitchen after that?",
    ].join("\n")
  );
  assert.equal(spokenFrom(result), "Josh: What did you change in the kitchen after that?");
  assert.equal(result.removals[0].uncertain, true);
});

test("business wording that resembles a retake stays", () => {
  const text = spoken(
    [
      "Guest (07:00)",
      "We don't use as much of it as you would in a meat pie. We had to start over with the recipe. We cut that SKU.",
    ].join("\n")
  );
  assert.match(text, /don't use as much/);
  assert.match(text, /start over with the recipe/);
  assert.match(text, /cut that SKU/);
});

test("intro, sponsor, and outro cues are removed and the interview stays", () => {
  const result = cleanTranscript(
    [
      "Intro (00:00)",
      "Welcome to Unit Economics. I'm your host.",
      "",
      "Sponsor (00:12)",
      "This episode is brought to you by Rho.",
      "",
      "Josh (00:20)",
      "Thanks for making the time.",
      "",
      "Guest (00:24)",
      "Happy to be here.",
      "",
      "Music (09:00)",
      "[music]",
      "",
      "Josh (09:05)",
      "Thanks for listening. Subscribe to hear the next episode.",
    ].join("\n")
  );
  assert.equal(spokenFrom(result), "Josh: Thanks for making the time.\nGuest: Happy to be here.");
  assert.equal(result.trims.length, 4);
});

test("committed transcripts contain no retake requests", () => {
  const dir = path.join(process.cwd(), "data", "transcripts");
  const files = fs.readdirSync(dir).filter((name) => name.endsWith(".txt"));
  assert.ok(files.length > 0);
  files.forEach((name) => {
    const parsed = parseTranscript(fs.readFileSync(path.join(dir, name), "utf8"));
    const text = parsed.map((turn) => turn.paragraphs.join(" ")).join("\n");
    assert.deepEqual(leftoverRetakePhrases(text), [], name);
  });
});

function spokenFrom(result) {
  return result.turns.map((turn) => `${turn.speaker}: ${turn.paragraphs.join(" ")}`).join("\n");
}
