#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { cleanTranscript, formatChangeLog, renderTranscript } = require("../src/lib/transcriptClean");

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function upsertLog(logPath, slug, section) {
  const heading = `## ${slug}`;
  const existing = fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8") : "# Transcript changes\n\n";
  const parts = existing.split(/^## /m);
  const preamble = parts[0].startsWith("# ") ? parts[0] : "# Transcript changes\n\n";
  const sections = parts.slice(1).map((part) => `## ${part}`);
  const next = sections.filter((part) => !part.startsWith(heading));
  next.push(section.trimEnd());
  next.sort();
  fs.writeFileSync(logPath, `${preamble.trimEnd()}\n\n${next.join("\n\n")}\n`);
}

function cleanFile(inputPath, slug, logPath) {
  const raw = fs.readFileSync(inputPath, "utf8");
  const result = cleanTranscript(raw);
  const outputPath = path.join(process.cwd(), "data", "transcripts", `${slug}.txt`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderTranscript(result.turns));
  if (logPath) upsertLog(logPath, slug, formatChangeLog(slug, result));
  return { outputPath, removals: result.removals.length, trims: result.trims.length, nameFixes: result.nameFixes.length };
}

function main() {
  const slug = readArg("--slug");
  const input = readArg("--in");
  const mapPath = readArg("--map");
  const rawDir = readArg("--raw-dir");
  const logPath = path.join(process.cwd(), "data", "transcripts", "CHANGES.md");

  if (mapPath && rawDir) {
    const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
    Object.entries(map).forEach(([filename, episodeSlug]) => {
      const summary = cleanFile(path.join(rawDir, filename), episodeSlug, logPath);
      console.log(`${episodeSlug}: ${summary.removals} retake removals, ${summary.trims} trims, ${summary.nameFixes} name fixes`);
    });
    return;
  }

  if (!slug || !input) {
    console.error("Usage: node scripts/clean-transcript.js --slug <episode-slug> --in <raw.txt>");
    console.error("   or: node scripts/clean-transcript.js --raw-dir <dir> --map <file-to-slug.json>");
    process.exit(1);
  }

  const summary = cleanFile(path.resolve(input), slug, logPath);
  console.log(`Wrote ${summary.outputPath}`);
  console.log(`${summary.removals} retake removals, ${summary.trims} trims, ${summary.nameFixes} name fixes`);
}

main();
