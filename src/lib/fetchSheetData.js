/**
 * Fetch episode overrides from the published Google Sheet (CSV).
 * The sheet is published at a stable URL — no API key needed.
 * Columns: slug, brand, guest, category, desc, spotify, apple, youtube, website
 */

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQRbV4hP7zdooVGUk1Qh1nudn1Psz8k0eVwPB52XVABBAE9DIIbyDY4U5lGEdihA3JezAcu8XKqGl6R/pub?gid=0&single=true&output=csv";

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
 * Fetch the published CSV and return a map keyed by slug.
 * Returns {} on failure so the site still builds.
 */
async function fetchSheetData() {
  try {
    const res = await fetch(SHEET_CSV_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    const text = await res.text();

    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return {};

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const slugIdx = headers.indexOf("slug");
    if (slugIdx === -1) {
      console.error("Sheet CSV missing 'slug' column");
      return {};
    }

    const overrides = {};
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const slug = (cols[slugIdx] || "").trim();
      if (!slug) continue;

      const row = {};
      headers.forEach((h, idx) => {
        if (h !== "slug" && cols[idx] && cols[idx].trim()) {
          row[h] = cols[idx].trim();
        }
      });

      overrides[slug] = row;
    }

    console.log(`Sheet: loaded ${Object.keys(overrides).length} episode overrides`);
    return overrides;
  } catch (err) {
    console.error("Failed to fetch sheet data:", err.message);
    return {};
  }
}

module.exports = { fetchSheetData };
