import { useEffect, useRef, useState } from "react";
import {
  SpotifyIcon,
  AppleIcon,
  YouTubeIcon,
  InstagramIcon,
  TikTokIcon,
  LinkedInIcon,
  SubstackIcon,
} from "./icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/#episodes", label: "Listen" },
  { href: "/#posts", label: "Read" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

const SOCIAL_LINKS = {
  spotify: {
    url: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F",
    hc: "#1DB954",
    icon: SpotifyIcon,
  },
  youtube: {
    url: "https://www.youtube.com/@TheUnitEconomicsPodcast",
    hc: "#FF0000",
    icon: YouTubeIcon,
  },
  apple: {
    url: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735",
    hc: "#9B59B6",
    icon: AppleIcon,
  },
  instagram: {
    url: "https://www.instagram.com/ue.pod/",
    hc: "#E1306C",
    icon: InstagramIcon,
  },
  tiktok: {
    url: "https://www.tiktok.com/@ue.pod",
    hc: "#fff",
    icon: TikTokIcon,
  },
  linkedin: {
    url: "https://www.linkedin.com/company/the-unit-economics-podcast/",
    hc: "#0A66C2",
    icon: LinkedInIcon,
  },
  substack: {
    url: "https://uepod.substack.com/",
    hc: "#FF6719",
    icon: SubstackIcon,
  },
};

function trackEvent(eventName, params = {}) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

function NavAnchor({ href, children }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        fontWeight: 400,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textDecoration: "none",
        transition: "color 0.2s",
        padding: "4px 0",
        borderBottom: "1px solid transparent",
      }}
    >
      {children}
    </a>
  );
}

function HoverLink({ href, hoverColor, children, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: hovered ? hoverColor : "rgba(255,255,255,0.3)",
        transition: "color 0.2s",
        textDecoration: "none",
        lineHeight: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

export default function SiteChrome({ children }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleScroll = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div
      className="site-shell"
      style={{
        background: "#000",
        color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        ref={contentRef}
        className="site-scroll"
        style={{ flex: 1, minHeight: 0, overflowX: "hidden", overflowY: "auto" }}
      >
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "28px 40px 20px",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid transparent",
          transition: "border-color 0.3s, backdrop-filter 0.3s",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          background: scrolled ? "rgba(0,0,0,0.85)" : "transparent",
        }}
      >
        <a href="/" style={{ display: "flex", alignItems: "center", lineHeight: 0 }}>
          <img
            src="/logo-horizontal.svg"
            alt="Unit Economics"
            style={{ height: "48px", width: "auto" }}
          />
        </a>

        <div
          className="nav-links"
          style={{ display: "flex", gap: "32px", alignItems: "center" }}
        >
          {NAV.map(({ href, label }) => (
            <NavAnchor key={href} href={href}>
              {label}
            </NavAnchor>
          ))}
        </div>

        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {NAV.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            onClick={() => setMenuOpen(false)}
            style={{
              color: "rgba(255,255,255,0.6)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "18px",
              fontWeight: 400,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
              padding: "8px 0",
            }}
          >
            {label}
          </a>
        ))}
      </div>

        {children}

        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "48px 40px 40px",
          }}
        >
          <div
            className="footer-inner footer-follow"
            style={{
              marginBottom: "32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <h3
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 400,
                fontSize: "18px",
                textTransform: "uppercase",
                marginBottom: "16px",
                letterSpacing: "0.02em",
              }}
            >
              Follow
            </h3>

            <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
              {Object.entries(SOCIAL_LINKS).map(
                ([key, { url, hc, icon: Icon }]) => (
                  <HoverLink
                    key={key}
                    href={url}
                    hoverColor={hc}
                    onClick={() =>
                      trackEvent("footer_social_click", { platform: key })
                    }
                  >
                    <Icon />
                  </HoverLink>
                )
              )}
            </div>
          </div>

          <div className="footer-bar">
            <a className="footer-glossary" href="/glossary">
              Glossary
            </a>
            <div
              className="footer-copyright"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.04em",
                textAlign: "right",
              }}
            >
              © 2025–2026 Unit Economics Podcast
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
