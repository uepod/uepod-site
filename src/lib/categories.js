function categorySlug(name) {
  return String(name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryPath(name) {
  const slug = categorySlug(name);
  return slug ? `/category/${slug}` : "";
}

module.exports = { categorySlug, categoryPath };
