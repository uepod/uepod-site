const fs = require("fs");
const path = require("path");

const OVERRIDES_PATH = path.join(process.cwd(), "data", "related-overrides.json");
const MENTIONS_PATH = path.join(process.cwd(), "data", "episode-mentions.json");

function readObject(file) {
  try {
    if (!fs.existsSync(file)) return {};
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch (err) {
    console.error(`Related data ignored (${path.basename(file)}):`, err.message);
    return {};
  }
}

/**
 * Pins and transcript mentions used when an episode page is built.
 * Either file can be missing or partial. A bad file is treated as empty.
 */
function loadRelatedSources(paths = {}) {
  return {
    overrides: readObject(paths.overrides || OVERRIDES_PATH),
    mentions: readObject(paths.mentions || MENTIONS_PATH),
  };
}

module.exports = {
  OVERRIDES_PATH,
  MENTIONS_PATH,
  loadRelatedSources,
};
