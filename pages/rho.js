import { useEffect } from "react";
import Head from "next/head";

const DESTINATION = "https://www.rho.co/partner/uniteconomics?utm_source=youtube&utm_medium=partner&utm_campaign=uniteconomics";
const MAX_WAIT_MS = 800;

function trackingDisabled() {
  try {
    const flag = new URLSearchParams(window.location.search).get("notrack");
    if (flag === "1") return true;
    if (flag === "0") return false;
    return window.localStorage.getItem("ue_notrack") === "1";
  } catch (err) {
    return false;
  }
}

const handoff = { started: false };

const bootScript = `(function () {
  if (window.__rhoHandoff) return;
  var dest = ${JSON.stringify(DESTINATION)};
  var left = false;
  function go() {
    if (left) return;
    left = true;
    location.replace(dest);
  }
  window.__rhoHandoff = { go: go, queued: false };
  var off = false;
  try {
    var flag = new URLSearchParams(location.search).get("notrack");
    if (flag === "1") off = true;
    else if (flag === "0") off = false;
    else off = localStorage.getItem("ue_notrack") === "1";
  } catch (e) {}
  if (off) {
    go();
    return;
  }
  setTimeout(go, ${MAX_WAIT_MS});
  window.dataLayer = window.dataLayer || [];
  var dl = window.dataLayer;
  var origPush = dl.push.bind(dl);
  dl.push = function () {
    var result = origPush.apply(dl, arguments);
    var entry = arguments[0];
    if (!window.__rhoHandoff.queued && entry && entry[0] === "config") {
      window.__rhoHandoff.queued = true;
      (function () {
        origPush.call(dl, arguments);
      })("event", "partner_link_visit", {
        partner: "rho",
        source: "vanity_url",
        event_callback: go,
        event_timeout: ${MAX_WAIT_MS}
      });
    }
    return result;
  };
})();`;

export default function RhoPage() {
  useEffect(() => {
    if (handoff.started) return undefined;
    handoff.started = true;

    const bridge = window.__rhoHandoff;
    let left = false;
    const go = () => {
      if (bridge && typeof bridge.go === "function") {
        bridge.go();
        return;
      }
      if (left) return;
      left = true;
      window.location.replace(DESTINATION);
    };

    if (!bridge) {
      if (trackingDisabled()) {
        go();
        return undefined;
      }
      window.setTimeout(go, MAX_WAIT_MS);
    }

    if (trackingDisabled()) return undefined;

    const send = () => {
      if (bridge && bridge.queued) return true;
      if (typeof window.gtag !== "function") return false;
      if (bridge) bridge.queued = true;
      window.gtag("event", "partner_link_visit", {
        partner: "rho",
        source: "vanity_url",
        event_callback: go,
        event_timeout: MAX_WAIT_MS,
      });
      return true;
    };

    if (!send()) {
      const startedAt = Date.now();
      const poll = window.setInterval(() => {
        if (Date.now() - startedAt >= MAX_WAIT_MS) {
          window.clearInterval(poll);
          return;
        }
        if (send()) window.clearInterval(poll);
      }, 50);
    }

    return undefined;
  }, []);

  return (
    <>
      <Head>
        <title>Taking you to Rho</title>
        <meta name="robots" content="noindex" />
        <meta httpEquiv="refresh" content={`1;url=${DESTINATION}`} />
      </Head>
      <main className="partners-page">
        <p className="partners-copy">
          Taking you to{" "}
          <a className="partners-link" href={DESTINATION} rel="noopener noreferrer">
            Rho
          </a>
          ...
        </p>
      </main>
      <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${DESTINATION}`} />
        <p className="partners-copy">
          <a className="partners-link" href={DESTINATION} rel="noopener noreferrer">
            Taking you to Rho...
          </a>
        </p>
      </noscript>
    </>
  );
}
