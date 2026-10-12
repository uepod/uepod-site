const { track } = require("@vercel/analytics");

function trackListenClick(platform, slug) {
  const payload = {
    platform,
    slug: slug || "",
  };
  track("listen_click", payload);
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "listen_click", payload);
  }
}

module.exports = { trackListenClick };
