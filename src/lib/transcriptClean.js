const { NAME_FIXES } = require("./transcript");

const SPEAKER_LINE = /^(.+?) \((\d{1,3}:\d{2}(?::\d{2})?)\)$/;

// Phrases that are the request itself. These must not survive in a published transcript.
const FORBIDDEN_RETAKE_PATTERNS = [
  ["off the record", /\boff the record\b/i],
  ["off air", /\boff air\b/i],
  ["scratch that", /\bscratch that\b/i],
  ["strike that", /\bstrike that\b/i],
  ["edit that out", /\bedit (that|this|it) out\b/i],
  ["cut that out", /\bcut (that|this|it) out\b/i],
  ["cut that", /\b(?:i'm gonna|i'm going to|i am going to|gonna) cut that\b/i],
  ["cut this question", /\b(?:gonna|going to) cut this question\b/i],
  ["retake", /\bretakes?\b/i],
  ["from the top", /\bfrom the top\b/i],
  ["let me rephrase", /\blet me rephrase\b/i],
  ["not for the recording", /\bnot for the (podcast|show|episode|recording)\b/i],
  ["don't include that", /\b(?:don't|do not|dont) include (?:that|this)\b/i],
  ["don't use that", /\b(?:don't|do not|dont) use (?:that|this)\b/i],
  ["take that again", /\b(?:take|say|do) that again\b/i],
  ["start that again", /\bstart (?:that|this) again\b/i],
  ["start over request", /\b(?:let me|let's|lets|can we|can i|i'll|we'll) start over\b/i],
  ["do that again", /\b(?:can we|could we|let's|lets|let me) (?:do|try|take|run) (?:that|this|it) again\b/i],
];

const PRECISE_REQUEST = /\b(let's retake|lets retake|let me rephrase|edit (?:that|this|it) out|off the record|scratch that|(?:i'm gonna|i'm going to|i am going to|gonna) cut that|(?:gonna|going to) cut this question)\b/i;

const BUSINESS_EXCEPTION = [
  /\bdon't use as much\b/i,
  /\b(?:cut|remove|delete) that (?:cost|price|fee|line|sku|product|ingredient|program|step|part)\b/i,
  /\bhad to start over\b/i,
  /\bstarted over\b/i,
  /\bstart over with\b/i,
];

const CUE_SPEAKER = /^(music|intro|outro|sponsor|advertisement|ad read|announcer|sound)$/i;
const CUE_TEXT = /^(\[?(music|applause|intro|outro|silence|laughter|pause)\]?[.\s]*)+$/i;
const BUMPER = /\b(welcome to (the )?unit economics|on today's episode|today we(?:'re| are) (?:speaking|talking) with)\b/i;
const CONVERSATION_START = /\b(thank you so much for (?:taking|coming|joining)|thanks for (?:having me|joining us|making the time)|if you wouldn't mind|could you (?:please )?give us)\b/i;
const SIGN_OFF = /\b(thanks for listening|thank you for listening|we hope you enjoyed|i hope you enjoyed|make sure to follow|if you haven't already|again, i learned so much|i learned so much during|i learned a lot during|subscribe wherever you listen|leave a review wherever)\b/i;
const DEBRIEF = /\blet'?s debrief\b/i;

function collapse(lines) {
  return lines.join("\n").replace(/\s+/g, " ").trim();
}

function splitSentences(text) {
  return String(text || "")
    .split(/(?<=[.?!])\s+/)
    .map((sentence) => sentence.replace(/^[.\s]+/, "").trim())
    .filter((sentence) => sentence && /[A-Za-z0-9]/.test(sentence));
}

function wordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function isBusinessOrRhetorical(value) {
  if (BUSINESS_EXCEPTION.some((pattern) => pattern.test(value))) return true;
  if (/\bjust to say that again\b/i.test(value)) return true;
  if (/\bstrike that balance\b/i.test(value)) return true;
  if (/\bfrom the top down\b/i.test(value)) return true;
  if (/\bstart over again\b/i.test(value) && /\b(color|screen|set up|break it down)\b/i.test(value)) return true;
  if (/\bfalse starts?\b/i.test(value) && /\bbusiness model\b/i.test(value)) return true;
  return false;
}

function isFromTheTopRequest(value) {
  return /\b(take it from the top|start from the top)\b/i.test(value) || /^from the top[.!]?$/i.test(value.trim());
}

function isRetakeSentence(sentence) {
  const value = String(sentence || "").trim();
  if (!value || isBusinessOrRhetorical(value)) return false;
  if (PRECISE_REQUEST.test(value) || /\boff air\b/i.test(value)) return true;
  if (isFromTheTopRequest(value)) return true;
  const words = wordCount(value);
  return FORBIDDEN_RETAKE_PATTERNS.some(([label, pattern]) => {
    if (!pattern.test(value)) return false;
    if (label === "from the top") return false;
    if (words <= 12) return true;
    return /^(sorry|wait|hold on|actually|no|okay|ok|um+|uh+|can we|could we|let's|lets|let me|should we)\b/i.test(value);
  });
}

function isRedoRequest(sentence) {
  return /\b(retake|rephrase|take (?:that|this|it) again|say (?:that|this|it) again|do (?:that|this|it) again|start over)\b/i.test(sentence)
    && isRetakeSentence(sentence)
    && !isEditOffer(sentence)
    && !isCutRequest(sentence);
}

function isEditOffer(sentence) {
  return /\b(edit (?:that|this|it) out|(?:gonna|going to) cut this question)\b/i.test(sentence);
}

function isCutRequest(sentence) {
  return /\b(?:i'm gonna|i'm going to|i am going to|gonna) cut that\b/i.test(sentence);
}

function isProductionSentence(sentence) {
  const value = String(sentence || "").trim();
  if (!value) return false;
  if (/\b(mute your notification|whatever your notification|codes in post|probably come out|just to be safe|looking something up|you hear that one come through|that should do it|one second, i'm gonna)\b/i.test(value)) {
    return true;
  }
  if (/\bsorry about that\b/i.test(value) && wordCount(value) <= 8) return true;
  if (/^(okay, )?i just turned\.?$/i.test(value)) return true;
  if (/^give me one(?: sec(?:ond)?)?\.?$/i.test(value)) return true;
  if (/^off\.?$/i.test(value)) return true;
  if (/\bdo that again if\b/i.test(value)) return true;
  return false;
}

function isAcknowledgement(sentence) {
  const normalized = String(sentence || "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return true;
  const words = normalized.split(" ").filter(Boolean);
  if (words.length > 8) return false;
  return words.every((word) => /^(okay|ok|yeah|yes|yep|sure|cool|totally|so|all|right|uh|um|hmm|no)$/i.test(word));
}

function isShortApology(sentence) {
  return wordCount(sentence) <= 4 && /\b(sorry|okay|ok)\b/i.test(sentence);
}

function stripAcknowledgements(text) {
  const sentences = splitSentences(text);
  let index = 0;
  while (index < sentences.length && isAcknowledgement(sentences[index])) index += 1;
  return sentences.slice(index).join(" ").trim();
}

function explodeMarkers(text) {
  return String(text || "").replace(
    /\s*\b(let me (?:let me )?rephrase|let me say that again)\b\s*/gi,
    ". $1. "
  );
}

function stripProduction(text) {
  const sentences = splitSentences(text);
  const flags = sentences.map(isProductionSentence);
  if (!flags.some(Boolean)) return { text: String(text || "").trim(), removed: false };
  const kept = sentences.filter((sentence, index) => {
    if (isRetakeSentence(sentence)) return true;
    if (flags[index]) return false;
    if (isShortApology(sentence) && (flags[index - 1] || flags[index + 1])) return false;
    return true;
  });
  let pieces = kept;
  if (flags[0]) {
    const ackStripped = splitSentences(stripAcknowledgements(pieces.join(" ")));
    pieces = ackStripped.length ? ackStripped : pieces.filter(isRetakeSentence);
  }
  const requests = pieces.filter(isRetakeSentence);
  const rest = pieces.filter((sentence) => !isRetakeSentence(sentence));
  const next = wordCount(rest.join(" ")) < 18 ? requests.join(" ") : pieces.join(" ");
  return { text: next.trim(), removed: true };
}

function privateAfter(sentence) {
  const match = String(sentence || "").match(/\b(off the record|off air)\b/i);
  if (!match) return "";
  return sentence.slice(match.index + match[0].length).replace(/^[\s,:-]+/, "").trim();
}

function isRecordSuggestion(sentence) {
  if (!/\b(off the record|off air)\b/i.test(sentence)) return false;
  return wordCount(privateAfter(sentence)) < 3;
}

function isOffRecordAside(sentence) {
  return /\boff the record\b/i.test(sentence) && !isRecordSuggestion(sentence);
}

function leftoverRetakePhrases(text) {
  const labels = new Set();
  splitSentences(text).forEach((sentence) => {
    if (!isRetakeSentence(sentence)) return;
    FORBIDDEN_RETAKE_PATTERNS.forEach(([label, pattern]) => {
      if (!pattern.test(sentence)) return;
      if (label === "from the top" && !isFromTheTopRequest(sentence)) return;
      labels.add(label);
    });
  });
  return [...labels];
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

function isShowOpen(block) {
  if (CUE_SPEAKER.test(block.speaker) || CUE_TEXT.test(block.text)) return true;
  if (CONVERSATION_START.test(block.text)) return false;
  if (BUMPER.test(block.text)) return true;
  if (/\b(?:we|i) hope you enjoy/i.test(block.text)) return true;
  if (/\b(i'm your host|this episode is (?:brought to you|sponsored)|our sponsor)\b/i.test(block.text)) return true;
  return /^(we also get into|we get into|in this conversation|we also (?:talk|discussed)|lastly, we)\b/i.test(block.text);
}

function trimIntro(items, trims) {
  const blocks = items.slice();
  while (blocks.length && isShowOpen(blocks[0])) {
    trims.push({
      timestamp: blocks[0].timestamp,
      reason: "Show intro, sponsor read, or music cue before the conversation.",
      uncertain: false,
    });
    blocks.shift();
  }
  if (blocks.length && BUMPER.test(blocks[0].text) && CONVERSATION_START.test(blocks[0].text)) {
    const sentences = splitSentences(blocks[0].text);
    const start = sentences.findIndex((sentence) => CONVERSATION_START.test(sentence));
    if (start > 0) {
      trims.push({
        timestamp: blocks[0].timestamp,
        reason: "Show intro before the conversation. The opening question stays.",
        uncertain: false,
      });
      blocks[0] = { ...blocks[0], text: sentences.slice(start).join(" ") };
    }
  }
  return blocks;
}

function isSignOff(block) {
  if (CUE_SPEAKER.test(block.speaker) || CUE_TEXT.test(block.text)) return true;
  return SIGN_OFF.test(block.text);
}

function trimOutro(items, trims) {
  let cut = items.length;
  let cutting = false;
  let host = "";
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const block = items[index];
    if (isSignOff(block) || DEBRIEF.test(block.text)) {
      cutting = true;
      host = host || block.speaker;
      cut = index;
      continue;
    }
    if (cutting && block.speaker === host && block.text.length < 180 && !block.text.includes("?")) {
      cut = index;
      continue;
    }
    break;
  }
  if (!cutting) return items;
  items.slice(cut).forEach((block) => {
    trims.push({
      timestamp: block.timestamp,
      reason: "Show outro or sign-off after the conversation.",
      uncertain: false,
    });
  });
  return items.slice(0, cut);
}

function trimEdges(blocks, trims) {
  const edged = trimOutro(trimIntro(blocks, trims), trims);
  return edged.filter((block) => {
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

function stripResume(text) {
  const sentences = splitSentences(text);
  const resumeAt = sentences.findIndex((sentence) => /\bback on the record\b/i.test(sentence));
  if (resumeAt === -1) return text;
  const after = sentences.slice(resumeAt + 1).join(" ").trim();
  const tail = sentences[resumeAt].replace(/^.*\bback on the record\b[,.]?\s*/i, "").trim();
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
    if (otherSpeaker && /\?\s*$/.test(text) && !isRetakeSentence(text) && !isOffRecordAside(text)) {
      return { end: index, includePartial: false, uncertain: true };
    }
  }
  return { end: items.length, includePartial: false, uncertain: true };
}

function isDecline(text) {
  return /^(no|nope|nah)\b/i.test(String(text || "").trim()) && wordCount(text) < 30;
}

function removeRetakes(blocks, removals) {
  const kept = [];
  let stripNextAck = false;
  for (let index = 0; index < blocks.length; index += 1) {
    let block = { ...blocks[index], text: explodeMarkers(blocks[index].text) };
    const produced = stripProduction(block.text);
    if (produced.removed) {
      const onlyRequest = produced.text && splitSentences(produced.text).every(isRetakeSentence);
      if (!onlyRequest) {
        removals.push({
          timestamp: block.timestamp,
          reason: produced.text
            ? "Production interruption. Removed the aside and kept the conversation around it."
            : "Production interruption. Removed the aside.",
          uncertain: false,
        });
      }
      if (!produced.text) continue;
      block = { ...block, text: produced.text };
    }

    if (stripNextAck) {
      const stripped = stripAcknowledgements(block.text);
      stripNextAck = false;
      if (!stripped) continue;
      block = { ...block, text: stripped };
    }

    const sentences = splitSentences(block.text);
    const requestAt = sentences.findIndex(isRetakeSentence);
    if (requestAt === -1) {
      kept.push(block);
      continue;
    }
    const request = sentences[requestAt];

    if (isEditOffer(request)) {
      const text = sentences.filter((sentence) => !isEditOffer(sentence)).join(" ").trim();
      if (text) kept.push({ ...block, text });
      removals.push({
        timestamp: block.timestamp,
        reason: "Edit-out offer. Removed the offer. The surrounding conversation stays.",
        uncertain: false,
      });
      continue;
    }

    if (isRecordSuggestion(request)) {
      const text = sentences.filter((sentence) => !isRecordSuggestion(sentence)).join(" ").trim();
      if (text) kept.push({ ...block, text });
      removals.push({
        timestamp: block.timestamp,
        reason: "Off air. Removed the request to leave the recording. The surrounding conversation stays.",
        uncertain: false,
      });
      continue;
    }

    if (isOffRecordAside(request)) {
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

    if (isCutRequest(request)) {
      let end = index + 1;
      while (end < blocks.length && end - index <= 4) {
        const next = blocks[end];
        if (next.speaker !== block.speaker && wordCount(next.text) > 8) break;
        end += 1;
      }
      removals.push({
        timestamp: block.timestamp,
        reason: "Cut request. Removed the request and the passage it referred to.",
        uncertain: end > index + 1,
      });
      index = end - 1;
      continue;
    }

    const after = sentences.slice(requestAt + 1).filter((sentence) => !isRetakeSentence(sentence));
    const before = sentences.slice(0, requestAt).filter((sentence) => !isRetakeSentence(sentence));
    if (isRedoRequest(request) && after.length) {
      kept.push({ ...block, text: after.join(" ") });
      removals.push({
        timestamp: block.timestamp,
        reason: "Retake request. Removed the false start and the request, and kept the later take.",
        uncertain: false,
      });
      continue;
    }

    if (isRedoRequest(request) && !after.length) {
      const next = blocks[index + 1];
      const declined = next && isDecline(next.text);
      if (!declined && kept.length) {
        const previous = kept.pop();
        removals.push({
          timestamp: previous.timestamp,
          reason: "Retake request. Removed the previous take and the request.",
          uncertain: previous.text.length > 500,
        });
      }
      removals.push({
        timestamp: block.timestamp,
        reason: declined
          ? "Retake offer. Removed the offer after it was declined."
          : "Retake request. Removed the request.",
        uncertain: false,
      });
      if (!declined) stripNextAck = true;
      continue;
    }

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
      const previous = kept.pop();
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
    turns: kept
      .filter((block) => block.text)
      .map((block) => ({
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
