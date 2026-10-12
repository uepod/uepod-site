const fs = require("fs");
const path = require("path");

const TRANSCRIPT_FILES = {
  "mikeys-pies-mikey-deegan": "mikeys-pies-mikey-deegan.txt",
};

const SPEAKER_LINE = /^(.+?) \((\d{1,2}:\d{2})\)$/;

// Proper names the recording clearly got wrong. Everything else stays as heard.
const NAME_FIXES = [["Union Economics", "Unit Economics"]];

function applyNameFixes(text) {
  return NAME_FIXES.reduce(
    (value, [from, to]) => value.split(from).join(to),
    text
  );
}

function paragraphFromLines(lines) {
  return applyNameFixes(lines.join("\n"))
    .replace(/\s+/g, " ")
    .trim();
}

function parseTranscript(raw) {
  const turns = [];
  let speaker = "";
  let lines = [];

  function flush() {
    if (!speaker) return;
    const paragraph = paragraphFromLines(lines);
    lines = [];
    if (!paragraph) return;
    turns.push({ speaker, paragraphs: [paragraph] });
  }

  for (const line of String(raw || "").replace(/\r\n/g, "\n").split("\n")) {
    const match = line.match(SPEAKER_LINE);
    if (match) {
      flush();
      speaker = match[1];
      continue;
    }
    if (speaker) lines.push(line);
  }
  flush();
  return turns;
}

function loadEpisodeTranscript(slug) {
  const filename = TRANSCRIPT_FILES[slug];
  if (!filename) return [];
  const file = path.join(process.cwd(), "data", "transcripts", filename);
  if (!fs.existsSync(file)) return [];
  return parseTranscript(fs.readFileSync(file, "utf8"));
}

module.exports = {
  NAME_FIXES,
  parseTranscript,
  loadEpisodeTranscript,
};
