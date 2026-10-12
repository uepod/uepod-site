import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "../src/styles/globals.css";

const GA_ID = "G-JZWSC4TBS0";

function trackingOff() {
  try {
    return window.localStorage.getItem("ue_notrack") === "1";
  } catch (err) {
    return false;
  }
}

function allowAnalyticsEvent(event) {
  if (trackingOff()) return null;
  return event;
}

function sendPageView() {
  if (trackingOff() || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path:
      window.location.pathname + window.location.search + window.location.hash,
    page_location: window.location.href,
  });
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [noTrack, setNoTrack] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("notrack");
    if (flag === "1") {
      localStorage.setItem("ue_notrack", "1");
      setNotice("Tracking is off on this device.");
    } else if (flag === "0") {
      localStorage.removeItem("ue_notrack");
      setNotice("Tracking is on for this device.");
    }
    setNoTrack(localStorage.getItem("ue_notrack") === "1");
    setReady(true);
  }, [router.asPath]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!ready || noTrack) return undefined;
    const originalPush = history.pushState;
    history.pushState = function pushState(...args) {
      const result = originalPush.apply(this, args);
      sendPageView();
      return result;
    };
    window.addEventListener("popstate", sendPageView);
    return () => {
      history.pushState = originalPush;
      window.removeEventListener("popstate", sendPageView);
    };
  }, [ready, noTrack]);

  return (
    <>
      <Component {...pageProps} />
      <Analytics beforeSend={allowAnalyticsEvent} />
      {ready && !noTrack ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
          </Script>
        </>
      ) : null}
      {notice ? (
        <p className="track-notice" role="status">
          {notice}
        </p>
      ) : null}
    </>
  );
}
