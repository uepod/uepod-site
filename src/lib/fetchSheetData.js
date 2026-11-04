/**
 * Fetch episode overrides from the published Google Sheet (CSV).
 * The sheet is published at a stable URL — no API key needed.
 * Columns: slug, brand, guest, category, desc, spotify, apple, youtube, website
 *
 * Google answers /export with a 307 to a short-lived googleusercontent.com
 * URL. A failed or non-CSV response used to become {}, and ISR then cached
 * episode pages with no categories or listen links. Retry once, follow the
 * redirect, and fall back to the committed snapshot.
 */

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1friDHGDSPZSDEV_8ERMjEs8xTpcTe_aYSdMpMKchq58/export?format=csv&gid=0";

const SNAPSHOT_PATH = path.join(
  __dirname,
  "../../data/episode-sheet-snapshot.csv"
);

const SHEET_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const MAX_REDIRECTS = 5;

class SheetUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = "SheetUnavailableError";
    this.sheetUnavailable = true;
  }
}

/**
 * Parse a CSV line, respecting quoted fields that may contain commas.
 */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Turn sheet CSV text into a slug → row map.
 * Returns an empty object when the body is not a usable sheet.
 */
function parseSheetCsv(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) return {};

  const headers = parseCSVLine(lines[0]).map((header) => header.toLowerCase().trim());
  const slugIdx = headers.indexOf("slug");
  if (slugIdx === -1) return {};

  const overrides = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const slug = (cols[slugIdx] || "").trim();
    if (!slug) continue;

    const row = {};
    headers.forEach((header, idx) => {
      if (header !== "slug" && cols[idx] && cols[idx].trim()) {
        row[header] = cols[idx].trim();
      }
    });
    overrides[slug] = row;
  }
  return overrides;
}

function requestSheet(url, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (err) {
      reject(err);
      return;
    }
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.get(
      parsed,
      {
        headers: {
          "User-Agent": SHEET_UA,
          Accept: "text/csv,text/plain,*/*",
        },
      },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) {
            reject(new Error(`Sheet fetch redirected too many times (${status})`));
            return;
          }
          const nextUrl = new URL(res.headers.location, parsed).toString();
          resolve(requestSheet(nextUrl, redirectsLeft - 1));
          return;
        }
        if (status < 200 || status >= 300) {
          res.resume();
          reject(new Error(`Sheet fetch failed: ${status}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      }
    );
    req.setTimeout(10000, () => {
      req.destroy(new Error("Sheet fetch timed out"));
    });
    req.on("error", reject);
  });
}

function readSnapshotFile() {
  return fs.readFileSync(SNAPSHOT_PATH, "utf8");
}

/**
 * Live sheet first (one retry, redirects followed). Committed snapshot if
 * the live fetch fails or has no rows. Throws when neither is usable so
 * ISR can keep the last good page.
 */
async function fetchSheetData({
  url = SHEET_CSV_URL,
  request = requestSheet,
  readSnapshot = readSnapshotFile,
} = {}) {
  let liveError = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await request(url);
      const overrides = parseSheetCsv(text);
      const count = Object.keys(overrides).length;
      if (count > 0) {
        console.log(`Sheet: loaded ${count} episode overrides`);
        return overrides;
      }
      liveError = new Error("Sheet CSV returned no rows");
    } catch (err) {
      liveError = err;
    }
    console.error(
      `Sheet fetch attempt ${attempt + 1} failed: ${liveError.message}`
    );
  }

  try {
    const overrides = parseSheetCsv(readSnapshot());
    const count = Object.keys(overrides).length;
    if (count > 0) {
      console.error(
        `Sheet snapshot: loaded ${count} episode overrides (${liveError.message})`
      );
      return overrides;
    }
  } catch (err) {
    console.error("Sheet snapshot unreadable:", err.message);
  }

  throw new SheetUnavailableError(
    `Episode sheet unavailable: ${liveError ? liveError.message : "no rows"}`
  );
}

module.exports = {
  fetchSheetData,
  parseSheetCsv,
  SheetUnavailableError,
  SHEET_CSV_URL,
  SNAPSHOT_PATH,
};
