const { NAME_FIXES } = require("./transcript");

const SPEAKER_LINE = /^(.+?) \((\d{1,2}:\d{2}(?::\d{2})?)\)$/;

// Phrases that are the request itself. These must not survive in a published transcript.
const FORBIDDEN_RETAKE_PATTERNS = [
  ["off the record", /\boff the record\b/i],
  ["scratch that", /\bscratch that\b/i],
  ["strike that", /\bstrike that\b/i],
  ["edit that out", /\bedit (that|this|it) out\b/i],
  ["cut that out", /\bcut (that|this|it) out\b/i],
  ["retake", /\bretakes?\b/i],
  ["from the top", /\bfrom the top\b/i],
  ["let me rephrase", /\blet me rephrase\b/i],
  ["not for the recording", /\bnot for the (podcast|show|episode|recording)\b/i],
  ["don't include that", /\b(?:don't|do not|dont) include (?:that|this)\b/i],
  ["don't use that", /\b(?:don't|do not|dont) use (?:that|this)\b/i],
  ["take that again", /\b(?:take|say|do|try) (?:that|this|it) again\b/i],
  ["start that again", /\bstart (?:that|this) again\b/i],
  ["start over request", /\b(?:let me|let's|lets|can we|can i|i'll|we'll) start over\b/i],
  ["do that again", /\b(?:can we|could we|let's|lets|let me) (?:do|try|take|run) (?:that|this|it) again\b/i],
];

const BUSINESS_EXCEPTION = [
  /\bdon't use as much\b/i,
  /\b(?:cut|remove|delete) that (?:cost|price|fee|line|sku|product|ingredient|program|step|part)\b/i,
  /\bhad to start over\b/i,
  /\bstarted over\b/i,
  /\bstart over with\b/i,
];

const CUE_SPEAKER = /^(music|intro|outro|sponsor|advertisement|ad read|announcer|sound)$/i;
const CUE_TEXT = /^(\[?(music|applause|intro|outro|silence|laughter|pause)\]?[.\s]*)+$/i;
const INTRO_TEXT = /\b(welcome to unit economics|i'm your host|this episode is (brought to you|sponsored)|our sponsor)\b/i;
const OUTRO_TEXT = /\b(thanks for listening|thank you for listening|subscribe to|see you next (week|time|episode)|if you enjoyed this episode)\b/i;

function collapse(lines) {
  return lines.join("\n").replace(/\s+/g, " ").trim();
}

function splitSentences(text) {
  return String(text || "")
    .split(/(?<=[.?!])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function isRetakeSentence(sentence) {
  const value = String(sentence || "").trim();
  if (!value) return false;
  if (BUSINESS_EXCEPTION.some((pattern) => pattern.test(value))) return false;
  const words = value.split(/\s+/).length;
  return FORBIDDEN_RETAKE_PATTERNS.some(([, pattern]) => {
    if (!pattern.test(value)) return false;
    if (words <= 24) return true;
    return /^(sorry|wait|hold on|actually|no|okay|ok|um+|uh+|can we|could we|let's|lets|let me)\b/i.test(value);
  });
}

function leftoverRetakePhrases(text) {
  const value = String(text || "");
  return FORBIDDEN_RETAKE_PATTERNS.filter(([, pattern]) => pattern.test(value)).map(([label]) => label);
}

function applyNameFixes(text, fixes) {
  const applied = [];
  const next = fixes.reduce((value, [from, to]) => {
    const count = value.split(from).length - 1;
    if (count > 0) applied.push({ from, to, count });
    return value.split(from).join(to);
  }, text);
  return { text: next, applied };
}

function parseBlocks(raw) {
  const blocks = [];
  let current = null;
  for (const line of String(raw || "").replace(/\r\n/g, "\n").split("\n")) {
    const match = line.match(SPEAKER_LINE);
    if (match) {
      if (current) blocks.push(current);
      current = { speaker: match[1].trim(), timestamp: match[2], lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) blocks.push(current);
  return blocks
    .map((block) => ({ ...block, text: collapse(block.lines) }))
    .filter((block) => block.text);
}

function isIntro(block) {
  if (CUE_SPEAKER.test(block.speaker) || CUE_TEXT.test(block.text)) return true;
  return INTRO_TEXT.test(block.text) && !block.text.includes("?");
}

function isOutro(block) {
  if (CUE_SPEAKER.test(block.speaker) || CUE_TEXT.test(block.text)) return true;
  return OUTRO_TEXT.test(block.text);
}

function trimEdges(blocks, trims) {
  const items = blocks.slice();
  while (items.length && isIntro(items[0])) {
    trims.push({
      timestamp: items[0].timestamp,
      reason: "Show intro, sponsor read, or music cue before the conversation.",
      uncertain: false,
    });
    items.shift();
  }
  while (items.length && isOutro(items[items.length - 1])) {
    trims.push({
      timestamp: items[items.length - 1].timestamp,
      reason: "Show outro or sign-off after the conversation.",
      uncertain: false,
    });
    items.pop();
  }
  return items.filter((block) => {
    if (CUE_SPEAKER.test(block.speaker) || CUE_TEXT.test(block.text)) {
      trims.push({
        timestamp: block.timestamp,
        reason: "Music or production cue.",
        uncertain: false,
      });
      return false;
    }
    return true;
  });
}

function isOffRecord(sentence) {
  return /\boff the record\b/i.test(sentence);
}

function stripResume(text) {
  const sentences = splitSentences(text);
  const resumeAt = sentences.findIndex((sentence) => /\bback on the record\b/i.test(sentence));
  if (resumeAt === -1) return text;
  const after = sentences.slice(resumeAt + 1).join(" ").trim();
  const resume = sentences[resumeAt];
  const tail = resume.replace(/^.*\bback on the record\b[,.]?\s*/i, "").trim();
  return [tail, after].filter(Boolean).join(" ").trim();
}

function findOffRecordEnd(items, start) {
  for (let index = start + 1; index < items.length; index += 1) {
    const text = items[index].text;
    if (/\bback on the record\b/i.test(text)) {
      return { end: index, includePartial: true, uncertain: false };
    }
    if (index - start >= 6) {
      return { end: index, includePartial: false, uncertain: true };
    }
    const otherSpeaker = items[index].speaker !== items[start].speaker;
    if (otherSpeaker && /\?\s*$/.test(text) && !isRetakeSentence(text) && !isOffRecord(text)) {
      return { end: index, includePartial: false, uncertain: true };
    }
  }
  return { end: items.length, includePartial: false, uncertain: true };
}

function removeRetakes(blocks, removals) {
  const kept = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const sentences = splitSentences(block.text);
    const requestAt = sentences.findIndex(isRetakeSentence);
    if (requestAt === -1) {
      kept.push(block);
      continue;
    }

    const request = sentences[requestAt];
    if (isOffRecord(request)) {
      const before = sentences.slice(0, requestAt).filter((sentence) => !isRetakeSentence(sentence)).join(" ");
      const later = sentences.slice(requestAt + 1);
      const resumeAt = later.findIndex((sentence) => /\bback on the record\b/i.test(sentence));
      if (resumeAt !== -1) {
        const tail = stripResume(later.slice(resumeAt).join(" "));
        const text = [before, tail].filter(Boolean).join(" ").trim();
        if (text) kept.push({ ...block, text });
        removals.push({
          timestamp: block.timestamp,
          reason: "Off the record. Removed the request and the aside, and kept the conversation after the resume.",
          uncertain: false,
        });
        continue;
      }
      const span = findOffRecordEnd(blocks, index);
      const partial = span.includePartial ? stripResume(blocks[span.end].text) : "";
      if (before) kept.push({ ...block, text: before });
      if (partial) kept.push({ ...blocks[span.end], text: partial });
      removals.push({
        timestamp: block.timestamp,
        reason: span.uncertain
          ? "Off the record. Removed the request and the following passage through the next clean question."
          : "Off the record. Removed the request and the aside, and kept the conversation after the resume.",
        uncertain: span.uncertain,
      });
      index = span.includePartial ? span.end : span.end - 1;
      continue;
    }

    const after = sentences.slice(requestAt + 1).filter((sentence) => !isRetakeSentence(sentence));
    const before = sentences.slice(0, requestAt).filter((sentence) => !isRetakeSentence(sentence));
    if (after.length) {
      kept.push({ ...block, text: after.join(" ") });
      removals.push({
        timestamp: block.timestamp,
        reason: "Retake request. Removed the false start and the request, and kept the later take.",
        uncertain: before.join(" ").length > 400,
      });
      continue;
    }

    if (!before.length && kept.length) {
      const previous = kept[kept.length - 1];
      kept.pop();
      removals.push({
        timestamp: previous.timestamp,
        reason: "Retake request. Removed the previous take and the request.",
        uncertain: previous.text.length > 500,
      });
      continue;
    }

    removals.push({
      timestamp: block.timestamp,
      reason: "Retake request. Removed the false start and the request.",
      uncertain: before.join(" ").length > 400,
    });
  }
  return kept;
}

function cleanTranscript(raw, options = {}) {
  const fixes = options.fixes || NAME_FIXES;
  const nameFixes = [];
  const named = parseBlocks(raw).map((block) => {
    const result = applyNameFixes(block.text, fixes);
    result.applied.forEach((fix) => {
      const existing = nameFixes.find((item) => item.from === fix.from && item.to === fix.to);
      if (existing) existing.count += fix.count;
      else nameFixes.push({ ...fix });
    });
    return { ...block, text: result.text };
  });
  const trims = [];
  const removals = [];
  const trimmed = trimEdges(named, trims);
  const kept = removeRetakes(trimmed, removals);
  return {
    turns: kept.map((block) => ({
      speaker: block.speaker,
      timestamp: block.timestamp,
      paragraphs: [block.text],
    })),
    removals,
    trims,
    nameFixes,
  };
}

function renderTranscript(turns) {
  return turns
    .map((turn) => `${turn.speaker} (${turn.timestamp})\n${turn.paragraphs.join("\n\n")}`)
    .join("\n\n")
    .concat("\n");
}

function formatChangeLog(slug, result) {
  const lines = [`## ${slug}`, ""];
  lines.push("Retake removals:");
  if (!result.removals.length) lines.push("- none");
  result.removals.forEach((removal) => {
    const flag = removal.uncertain ? " Uncertain span, so the larger passage was removed." : "";
    lines.push(`- ${slug} at ${removal.timestamp}: ${removal.reason}${flag}`);
  });
  lines.push("", "Intro and outro trims:");
  if (!result.trims.length) lines.push("- none");
  result.trims.forEach((trim) => {
    const flag = trim.uncertain ? " Uncertain trim." : "";
    lines.push(`- ${slug} at ${trim.timestamp}: ${trim.reason}${flag}`);
  });
  lines.push("", "Name fixes:");
  if (!result.nameFixes.length) lines.push("- none");
  result.nameFixes.forEach((fix) => {
    lines.push(`- "${fix.from}" to "${fix.to}" (${fix.count})`);
  });
  lines.push("");
  return lines.join("\n");
}

module.exports = {
  FORBIDDEN_RETAKE_PATTERNS,
  cleanTranscript,
  formatChangeLog,
  isRetakeSentence,
  leftoverRetakePhrases,
  renderTranscript,
};
