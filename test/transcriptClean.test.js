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

test("a retake with a preamble drops the previous take and the acknowledgement", () => {
  const text = spoken(
    [
      "Guest (58:32)",
      "You can use the code. Just UE pod.",
      "",
      "Josh (58:46)",
      "I think it's a pod. We'll figure it out. We're going to do the codes in post, so don't worry about it. Should we, let's retake this one.",
      "",
      "Guest (58:50)",
      "Okay, cool. Yeah, totally. You can visit us at the website.",
    ].join("\n")
  );
  assert.equal(text, "Guest: You can visit us at the website.");
});

test("an edit-out offer is removed and the story stays", () => {
  const text = spoken(
    [
      "Host (26:38)",
      "Now you have to do it. If you don't want that out there, I'm happy to edit that out in post, but I think it's fascinating.",
      "",
      "Guest (26:43)",
      "No, it's time. We wrote it into the game.",
    ].join("\n")
  );
  assert.equal(text, "Host: Now you have to do it.\nGuest: No, it's time. We wrote it into the game.");
});

test("a rephrase keeps the later take inside a run-on line", () => {
  const text = spoken(
    [
      "Guest (26:23)",
      "have taken a customer to small or let me let me rephrase we've threatened taking someone to small claims",
    ].join("\n")
  );
  assert.equal(text, "Guest: we've threatened taking someone to small claims");
});

test("an off-air suggestion removes only the suggestion", () => {
  const text = spoken(
    [
      "Guest (26:23)",
      "We threatened small claims.",
      "",
      "Host (26:39)",
      "Perhaps a story for off air.",
      "",
      "Guest (26:42)",
      "We won't be naming names.",
    ].join("\n")
  );
  assert.equal(text, "Guest: We threatened small claims.\nGuest: We won't be naming names.");
});

test("rhetorical and business echoes of retake wording stay", () => {
  const text = spoken(
    [
      "Guest (04:00)",
      "Just to say that again, there's an over prescription challenge. We tried to strike that balance. From the top down, the team stayed. You set up, break it down, start over again for each color. We have buy-in from the top. And then once you've kind of come to that point, you say now basically let's do that again. So what are all of the permutations? And then they'll come back and try it again.",
    ].join("\n")
  );
  assert.match(text, /Just to say that again/);
  assert.match(text, /strike that balance/);
  assert.match(text, /From the top down/);
  assert.match(text, /start over again/);
  assert.match(text, /from the top/);
  assert.match(text, /let's do that again/);
  assert.match(text, /try it again/);
  assert.deepEqual(leftoverRetakePhrases(text), []);
});

test("a welcome bumper is removed and the following narration stays", () => {
  const text = spoken(
    [
      "Host (00:00)",
      "Welcome to the Unit Economics Podcast. I'm Josh Stabinsky.",
      "",
      "Host (00:04)",
      "Today's episode is a little different. It was a dinner party.",
    ].join("\n")
  );
  assert.equal(text, "Host: Today's episode is a little different. It was a dinner party.");
});

test("a cut request removes the aside and keeps the explanation", () => {
  const result = cleanTranscript(
    [
      "Josh (34:22)",
      "Yeah, that makes sense. That's so embarrassing. I'm gonna cut that.",
      "",
      "Guest (34:25)",
      "Same",
      "",
      "Josh (34:28)",
      "As soon as we're done I'll be like, okay, that makes sense. I digress.",
      "",
      "Guest (34:35)",
      "Well, 60 minutes is an hour and there's eight hours of class.",
    ].join("\n")
  );
  assert.equal(spokenFrom(result), "Guest: Well, 60 minutes is an hour and there's eight hours of class.");
  assert.equal(result.removals[0].uncertain, true);
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
