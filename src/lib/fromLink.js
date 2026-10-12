const FROM_PATH = /^\/(episodes|topics|category)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isSafeFromPath(value) {
  return FROM_PATH.test(String(value || ""));
}

function isSafeFromName(value) {
  const name = String(value || "").replace(/\s+/g, " ").trim();
  if (!name || name.length > 80) return "";
  if (/[<>]/.test(name)) return "";
  return name;
}

function withFrom(href, fromPath, fromName) {
  const path = String(fromPath || "");
  const name = isSafeFromName(fromName);
  if (!href || !isSafeFromPath(path) || !name) return href;
  const hashAt = href.indexOf("#");
  const hash = hashAt >= 0 ? href.slice(hashAt) : "";
  const base = hashAt >= 0 ? href.slice(0, hashAt) : href;
  let url;
  try {
    url = new URL(base, "https://uepod.com");
  } catch {
    return href;
  }
  if (url.origin !== "https://uepod.com") return href;
  url.searchParams.set("from", path);
  url.searchParams.set("fromName", name);
  return `${url.pathname}${url.search}${hash}`;
}

function backLinkFromSearch(search, currentPath) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const from = params.get("from");
  const name = isSafeFromName(params.get("fromName"));
  if (!isSafeFromPath(from) || !name) return null;
  if (currentPath && from === currentPath) return null;
  return { href: from, label: `← Back to ${name}` };
}

module.exports = {
  withFrom,
  backLinkFromSearch,
  isSafeFromPath,
  isSafeFromName,
};
