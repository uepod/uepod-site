import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { fetchEpisodes } from "../src/lib/fetchEpisodes";

/* ===== GA4 EVENT HELPER ===== */
function trackEvent(eventName, params = {}) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

/* ===== ICON COMPONENTS ===== */
const SpotifyIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
);
const AppleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 10.2c-.1-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3.1-1.7-1.3-.1-2.6.8-3.2.8-.7 0-1.7-.8-2.8-.7-1.4 0-2.7.8-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7 1.3 0 1.7.7 2.8.7 1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.3 1.2-2.4 0 0-2.3-.9-2.4-3.4zM16.7 3.8c.6-.7 1-1.7.9-2.7-.8 0-1.9.6-2.5 1.3-.5.6-1 1.7-.9 2.6.9.1 1.9-.5 2.5-1.2z"/></svg>
);
const YouTubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);
const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

/* ===== SOCIAL LINKS ===== */
const SOCIAL_LINKS = {
  spotify: { url: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", hc: "#1DB954", icon: SpotifyIcon },
  youtube: { url: "https://www.youtube.com/@TheUnitEconomicsPodcast", hc: "#FF0000", icon: YouTubeIcon },
  apple: { url: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", hc: "#9B59B6", icon: AppleIcon },
  instagram: { url: "https://www.instagram.com/ue.pod/", hc: "#E1306C", icon: InstagramIcon },
  tiktok: { url: "https://www.tiktok.com/@ue.pod", hc: "#fff", icon: TikTokIcon },
  linkedin: { url: "https://www.linkedin.com/company/the-unit-economics-podcast/", hc: "#0A66C2", icon: LinkedInIcon },
};

/* ===== HOVERABLE LINK COMPONENT ===== */
function HoverLink({ href, hoverColor, children, style = {}, onClick, ...props }) {
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
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      {...props}
    >
      {children}
    </a>
  );
}

/* ===== EPISODE CARD ===== */
function EpisodeCard({ ep, index }) {
  const [brandHovered, setBrandHovered] = useState(false);
  return (
    <div
      className="episode-grid"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "28px 0",
        display: "grid",
        gridTemplateColumns: "48px 1fr auto",
        gap: "20px",
        alignItems: "start",
        opacity: 0,
        animation: `fadeUp 0.4s ease ${index * 0.03}s forwards`,
      }}
    >
      {/* Episode number */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          color: "rgba(255,255,255,0.3)",
          paddingTop: "4px",
          letterSpacing: "0.05em",
        }}
      >
        {String(ep.id).padStart(2, "0")}
      </div>

      {/* Main content */}
      <div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: "6px",
          }}
        >
          {ep.category}
        </div>
        <div
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: "22px",
            fontWeight: 400,
            lineHeight: 1.25,
            marginBottom: "4px",
            textTransform: "uppercase",
          }}
        >
          <a
            href={ep.spotify}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#fff",
              textDecoration: brandHovered ? "underline" : "none",
            }}
            onMouseEnter={() => setBrandHovered(true)}
            onMouseLeave={() => setBrandHovered(false)}
            onClick={() => trackEvent("episode_brand_click", { episode_name: ep.brand })}
          >
            {ep.brand}
          </a>
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "15px",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "10px",
            fontWeight: 400,
          }}
        >
          {ep.guest}
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "14px",
            color: "rgba(255,255,255,0.35)",
            lineHeight: 1.6,
            maxWidth: "640px",
          }}
        >
          {ep.desc}
        </div>

        {/* Inline date/duration for mobile */}
        <div
          className="episode-meta-inline"
          style={{
            display: "none",
            gap: "12px",
            marginTop: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          <span>{ep.date}</span>
          <span>{ep.duration}</span>
        </div>

        {/* Platform links */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            marginTop: "14px",
            alignItems: "center",
          }}
        >
          <HoverLink href={ep.spotify} hoverColor="#1DB954" onClick={() => trackEvent("episode_platform_click", { platform: "spotify", episode_name: ep.brand })}><SpotifyIcon /></HoverLink>
          <HoverLink href={ep.apple} hoverColor="#9B59B6" onClick={() => trackEvent("episode_platform_click", { platform: "apple_podcasts", episode_name: ep.brand })}><AppleIcon /></HoverLink>
          <HoverLink href={ep.youtube} hoverColor="#FF0000" onClick={() => trackEvent("episode_platform_click", { platform: "youtube", episode_name: ep.brand })}><YouTubeIcon /></HoverLink>
        </div>
      </div>

      {/* Date/duration — hidden on mobile */}
      <div
        className="episode-meta"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          color: "rgba(255,255,255,0.25)",
          textAlign: "right",
          whiteSpace: "nowrap",
          paddingTop: "4px",
        }}
      >
        <div>{ep.date}</div>
        <div style={{ marginTop: "4px" }}>{ep.duration}</div>
      </div>
    </div>
  );
}

/* ===== NAV LINK WITH HOVER ===== */
function NavButton({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        color: active
          ? "#fff"
          : hovered
          ? "rgba(255,255,255,0.75)"
          : "rgba(255,255,255,0.4)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        fontWeight: 400,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "color 0.2s",
        padding: "4px 0",
        borderBottom: active
          ? "1px solid rgba(255,255,255,0.5)"
          : "1px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

/* ===== PLATFORM BUTTON WITH HOVER ===== */
function PlatformButton({ href, hoverColor, icon: Icon, label, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 20px",
        border: `1px solid ${hovered ? hoverColor : "rgba(255,255,255,0.2)"}`,
        textDecoration: "none",
        color: hovered ? hoverColor : "#fff",
        fontSize: "13px",
        fontWeight: 500,
        letterSpacing: "0.04em",
        transition: "all 0.2s",
        fontFamily: "'Space Grotesk', sans-serif",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <Icon /> {label}
    </a>
  );
}

/* ===== MAIN PAGE ===== */
export default function Home({ episodes }) {
  const [section, setSection] = useState("home");
  const [filter, setFilter] = useState("All");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef(null);

  const categories = ["All", ...new Set(episodes.map(e => e.category))].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;
    return a.localeCompare(b);
  });

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [section]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const filtered =
    filter === "All" ? episodes : episodes.filter(e => e.category === filter);

  const navigate = (s) => {
    setSection(s);
    trackEvent("nav_click", { section: s });
    if (s !== "episodes") setFilter("All");
    setMenuOpen(false);
  };

  return (
    <>
      <Head>
        <title>Unit Economics — Exploring the hidden complexity behind every industry</title>
      </Head>

      <div
        style={{
          background: "#000",
          color: "#fff",
          minHeight: "100vh",
          fontFamily: "'Space Grotesk', sans-serif",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ===== NAV ===== */}
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 40px",
            borderBottom: scrolled
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid transparent",
            transition: "border-color 0.3s, backdrop-filter 0.3s",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
            background: scrolled ? "rgba(0,0,0,0.85)" : "transparent",
          }}
        >
          <div
            onClick={() => navigate("home")}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <img
              src="/logo-white.png"
              alt="Unit Economics"
              style={{ height: "54px", width: "auto" }}
            />
          </div>

          {/* Desktop nav */}
          <div
            className="nav-links"
            style={{ display: "flex", gap: "32px", alignItems: "center" }}
          >
            {[
              { key: "home", label: "Home" },
              { key: "episodes", label: "Listen" },
              { key: "about", label: "About" },
              { key: "contact", label: "Contact" },
            ].map(({ key, label }) => (
              <NavButton
                key={key}
                label={label}
                active={section === key}
                onClick={() => navigate(key)}
              />
            ))}
          </div>

          {/* Hamburger */}
          <button
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </nav>

        {/* Mobile menu overlay */}
        <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
          {[
            { key: "home", label: "Home" },
            { key: "episodes", label: "Listen" },
            { key: "about", label: "About" },
            { key: "contact", label: "Contact" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={section === key ? "active" : ""}
              onClick={() => navigate(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ===== CONTENT ===== */}
        <div
          ref={contentRef}
          style={{ flex: 1, overflow: "auto", scrollBehavior: "smooth" }}
        >
          {/* ===== HOME ===== */}
          {section === "home" && (
            <div style={{ animation: "fadeIn 0.5s ease" }}>
              {/* Hero */}
              <div
                className="hero-section"
                style={{ padding: "120px 40px 56px" }}
              >
                <h1
                  className="hero-title"
                  style={{
                    fontFamily: "'Anton', sans-serif",
                    fontWeight: 400,
                    fontSize: "clamp(48px, 8vw, 110px)",
                    lineHeight: 1.0,
                    letterSpacing: "0.01em",
                    textTransform: "uppercase",
                    marginBottom: "40px",
                  }}
                >
                  The real mechanics behind<span className="hero-br"><br /></span> your favorite brands.
                </h1>
                <p
                  className="hero-subtitle"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "clamp(16px, 2vw, 20px)",
                    fontWeight: 300,
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.65,
                    maxWidth: "720px",
                  }}
                >
                  Conversations with founders on how products are designed,
                  manufactured, priced, and distributed — with a focus on the
                  decisions, economics, and tradeoffs behind the scenes.
                </p>
                <div
                  className="platform-buttons"
                  style={{
                    display: "flex",
                    gap: "16px",
                    marginTop: "48px",
                  }}
                >
                  <PlatformButton
                    href={SOCIAL_LINKS.spotify.url}
                    hoverColor="#1DB954"
                    icon={SpotifyIcon}
                    label="Spotify"
                    onClick={() => trackEvent("hero_platform_click", { platform: "spotify" })}
                  />
                  <PlatformButton
                    href={SOCIAL_LINKS.apple.url}
                    hoverColor="#9B59B6"
                    icon={AppleIcon}
                    label="Apple Podcasts"
                    onClick={() => trackEvent("hero_platform_click", { platform: "apple_podcasts" })}
                  />
                  <PlatformButton
                    href={SOCIAL_LINKS.youtube.url}
                    hoverColor="#FF0000"
                    icon={YouTubeIcon}
                    label="YouTube"
                    onClick={() => trackEvent("hero_platform_click", { platform: "youtube" })}
                  />
                </div>
              </div>

              {/* Latest episodes preview */}
              <div
                className="content-section"
                style={{
                  padding: "0 40px 80px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    paddingTop: "32px",
                    marginBottom: "8px",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: "13px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    Latest Episodes
                  </h2>
                  <NavButton
                    label="View all →"
                    active={false}
                    onClick={() => navigate("episodes")}
                  />
                </div>
                {episodes.slice(0, 3).map((ep, i) => (
                  <EpisodeCard key={ep.id} ep={ep} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ===== EPISODES ===== */}
          {section === "episodes" && (
            <div
              className="content-section"
              style={{
                padding: "48px 40px 80px",
                animation: "fadeIn 0.4s ease",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(32px, 4vw, 48px)",
                  letterSpacing: "0.01em",
                  textTransform: "uppercase",
                  marginBottom: "32px",
                }}
              >
                Episodes
              </h2>

              {/* Filter bar */}
              <div
                className="filter-bar"
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "32px",
                }}
              >
                {categories.map(cat => (
                  <FilterButton
                    key={cat}
                    label={cat}
                    active={filter === cat}
                    onClick={() => {
                      setFilter(cat);
                      trackEvent("filter_click", { category: cat });
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.2)",
                  marginBottom: "16px",
                }}
              >
                {filtered.length} episode{filtered.length !== 1 ? "s" : ""}
              </div>

              {filtered.map((ep, i) => (
                <EpisodeCard key={ep.id} ep={ep} index={i} />
              ))}
            </div>
          )}

          {/* ===== ABOUT ===== */}
          {section === "about" && (
            <div
              className="content-section"
              style={{
                padding: "80px 40px",
                animation: "fadeIn 0.5s ease",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(32px, 4vw, 48px)",
                  letterSpacing: "0.01em",
                  textTransform: "uppercase",
                  marginBottom: "40px",
                }}
              >
                About
              </h2>
              <div
                className="about-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "60px",
                  alignItems: "start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "24px",
                      fontWeight: 400,
                      lineHeight: 1.45,
                      marginBottom: "40px",
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    <a
                      href="https://linkedin.com/in/stabinsky"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.borderBottom =
                          "1px solid rgba(255,255,255,0.4)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.borderBottom = "none")
                      }
                    >
                      Josh Stabinsky
                    </a>{" "}
                    lives in San Francisco and spends a lot of time drinking
                    coffee. He loves consumer packaged goods. And dogs.
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "15px",
                      lineHeight: 1.75,
                      color: "rgba(255,255,255,0.45)",
                      marginBottom: "40px",
                    }}
                  >
                    Unit Economics is a long-form interview podcast that digs
                    into how products are actually designed, manufactured,
                    priced, and distributed. Each episode is a conversation with
                    a founder, operator, or builder about the decisions,
                    constraints, and tradeoffs behind their business. The show
                    covers industries from food and beverage to hardware, games,
                    apparel, and beyond.
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "15px",
                      lineHeight: 1.75,
                      color: "rgba(255,255,255,0.45)",
                    }}
                  >
                    New episodes every week. Available on Spotify, Apple
                    Podcasts, and YouTube.
                  </div>
                </div>
                <img
                  className="about-image"
                  src="/josh-about.png"
                  alt="Josh Stabinsky"
                  style={{ width: "100%", maxWidth: "400px", height: "auto" }}
                />
              </div>
            </div>
          )}

          {/* ===== CONTACT ===== */}
          {section === "contact" && (
            <div
              className="content-section"
              style={{
                padding: "80px 40px",
                maxWidth: "680px",
                animation: "fadeIn 0.5s ease",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(32px, 4vw, 48px)",
                  letterSpacing: "0.01em",
                  textTransform: "uppercase",
                  marginBottom: "40px",
                }}
              >
                Contact
              </h2>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "17px",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.55)",
                  marginBottom: "32px",
                }}
              >
                Guest suggestions, press inquiries, sponsorship, or just want to
                say hi?
              </div>
              <a
                href="mailto:hello@uepod.com"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "24px",
                  fontWeight: 400,
                  color: "#fff",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.3)",
                  paddingBottom: "4px",
                }}
              >
                hello@uepod.com
              </a>
            </div>
          )}

          {/* ===== FOOTER ===== */}
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
                  fontFamily: "'Anton', sans-serif",
                  fontWeight: 400,
                  fontSize: "18px",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                  letterSpacing: "0.02em",
                }}
              >
                Follow
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "18px",
                  alignItems: "center",
                }}
              >
                {Object.entries(SOCIAL_LINKS).map(
                  ([key, { url, hc, icon: Icon }]) => (
                    <HoverLink key={key} href={url} hoverColor={hc} onClick={() => trackEvent("footer_social_click", { platform: key })}>
                      <Icon />
                    </HoverLink>
                  )
                )}
              </div>
            </div>
            <div
              className="footer-copyright"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: "20px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.04em",
                textAlign: "right",
              }}
            >
              © 2025–2026 Unit Economics Podcast
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

/* ===== FILTER BUTTON ===== */
function FilterButton({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active
          ? "#fff"
          : hovered
          ? "rgba(255,255,255,0.06)"
          : "transparent",
        color: active
          ? "#000"
          : hovered
          ? "rgba(255,255,255,0.6)"
          : "rgba(255,255,255,0.4)",
        border: active
          ? "1px solid #fff"
          : "1px solid rgba(255,255,255,0.12)",
        padding: "6px 14px",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

/* ===== BUILD-TIME DATA FETCHING ===== */
export async function getStaticProps() {
  let episodes;
  try {
    episodes = await fetchEpisodes();
  } catch (err) {
    console.error("RSS fetch failed, using empty array:", err.message);
    episodes = [];
  }

  // If RSS fails, fall back to a known good list (could also import from a static file)
  if (!episodes || episodes.length === 0) {
    console.warn("No episodes from RSS, page will render with empty list.");
  }

  return {
    props: {
      episodes: JSON.parse(JSON.stringify(episodes)), // serialize dates
    },
    revalidate: 3600, // ISR: revalidate every hour
  };
}
