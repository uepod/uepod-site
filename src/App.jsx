import { useState, useEffect, useRef } from "react";

const EPISODES = [
  { id: 29, brand: "Lottie's Meats", guest: "Chelsey & Cassie Maschhoff", desc: "Building a premium sausage brand: USDA facility constraints, frozen DTC economics, and competing in a category where consumers think mostly about price.", duration: "48 min", date: "Mar 19, 2026", category: "Food & Beverage", website: "https://lottiesmeats.com", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 28, brand: "Byte'm", guest: "Jack Davis & Jacob Tubis", desc: "Translating a home brownie recipe into scalable production, ingredient costs, packaging as communication, and building retail distribution from scratch.", duration: "47 min", date: "Mar 17, 2026", category: "Food & Beverage", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 27, brand: "Armada", guest: "Seamus Meniahane", desc: "How modern band merch actually works: sourcing blanks, screen printing, tour logistics, and the economics of artist merchandise.", duration: "39 min", date: "Mar 12, 2026", category: "Logistics", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 26, brand: "Lil Tuffy", guest: "Lil Tuffy", desc: "Two decades of concert poster art: print runs, revenue splits, screen printing logistics, and the evolution from promo material to collectible merch.", duration: "36 min", date: "Mar 10, 2026", category: "Art & Design", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 25, brand: "Muttville", guest: "Sherri Franklin", desc: "Running a senior dog rescue at scale: foster networks, adoption mechanics, nonprofit structure, and placing over 14,000 dogs.", duration: "43 min", date: "Mar 5, 2026", category: "Nonprofit", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 24, brand: "Kelly Bennett", guest: "Kelly Bennett", desc: "Pre-launch brand strategy for CPG founders: retail positioning, demand creation, building in public, and turning a podcast into a client funnel.", duration: "46 min", date: "Mar 3, 2026", category: "Strategy", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 23, brand: "Pickle", guest: "Brian McMahon", desc: "Peer-to-peer rental marketplace mechanics: the pivot from social polling, personally completing thousands of deliveries, and building network effects.", duration: "43 min", date: "Feb 26, 2026", category: "Marketplace", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 22, brand: "Hiya", guest: "Adam Gillman", desc: "Rethinking children's vitamins: 100% subscription from day one, formulation tradeoffs, bootstrapped growth, and the path to acquisition.", duration: "37 min", date: "Feb 24, 2026", category: "Health & Wellness", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 21, brand: "Sourmilk", guest: "Kiki Couchman & Elan Halpern", desc: "Probiotic yogurt formulated around specific strains, sourcing grass-fed dairy, co-manufacturing from scratch, and gut-health as a product thesis.", duration: "45 min", date: "Feb 19, 2026", category: "Food & Beverage", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 20, brand: "Light", guest: "Joe Hollier", desc: "Building the Light Phone: hardware in a software world, Foxconn at small scale, NRE costs, bill of materials, tariffs, and inventory financing.", duration: "50 min", date: "Feb 17, 2026", category: "Consumer Tech", spotify: "https://open.spotify.com/episode/6aVLPEySGEsSUhtQcVWMYo", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 19, brand: "Felt + Fat", guest: "Nate Mell", desc: "Scaling a ceramics studio: restaurant tableware, debt-financed equipment, vertical integration limits, and financial distress as a forcing function.", duration: "52 min", date: "Feb 10, 2026", category: "Home Goods", spotify: "https://open.spotify.com/episode/4hfxoAe2yLvdKTm6toUcGB", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 18, brand: "Hotel", guest: "Sara Victorio", desc: "Handmade ceramics in Portland: self-taught production, Instagram as a storefront, scaling without losing the handmade quality.", duration: "40 min", date: "Feb 4, 2026", category: "Home Goods", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 17, brand: "GOB", guest: "Lauryn Menard", desc: "Rethinking single-use products with mycelium earplugs: commercializing a new biomaterial, pricing in a price-sensitive category, and subscription as the core model.", duration: "42 min", date: "Jan 27, 2026", category: "Health & Wellness", spotify: "https://open.spotify.com/episode/5hEG9JtblMKOBMtErZ54qT", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 16, brand: "One Trick Pony", guest: "Lucy Dana", desc: "From Uber and Blue Bottle to launching a coffee brand with family, e-commerce operations, and data-driven entrepreneurship.", duration: "44 min", date: "Jan 22, 2026", category: "Food & Beverage", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 15, brand: "Jones", guest: "Hilary Dubin & Caroline Huber", desc: "Nicotine cessation for vapers: regulated physical product alongside software, FDA economics, and fundraising in a tightly regulated space.", duration: "48 min", date: "Jan 21, 2026", category: "Health & Wellness", spotify: "https://open.spotify.com/episode/0lBlHXVR6CDp6ZTipDm1h5", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 14, brand: "Erstwhile", guest: "Jared", desc: "Fifth-generation jeweler: antique and vintage jewelry, family legacy from Russia to America, and building a modern brand on century-old expertise.", duration: "46 min", date: "Jan 14, 2026", category: "Jewelry", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 13, brand: "Nymzo", guest: "Elliott Walker & Tim Hucklesby", desc: "A modern chess brand built from scratch: tooling decisions, material choices, MOQs, and bootstrapping a premium physical product.", duration: "44 min", date: "Jan 14, 2026", category: "Games & Leisure", spotify: "https://open.spotify.com/episode/3hBuCEHtyhZa9BRkXBhROC", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 12, brand: "Young Jerks / Weastcoast", guest: "Dan Cassaro, Dan Christofferson & Meg Yahashi", desc: "From branding studio to board game company: product development, manufacturing, and running two businesses simultaneously.", duration: "50 min", date: "Jan 9, 2026", category: "Games & Leisure", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 11, brand: "Bezi", guest: "Ilay Karateke", desc: "Introducing labneh to U.S. grocery: retail-first strategy, in-store demos, bootstrapping against funded competitors, and scaling inside Whole Foods.", duration: "45 min", date: "Dec 29, 2025", category: "Food & Beverage", spotify: "https://open.spotify.com/episode/4qnqlABwYybqeLuhmmbT3s", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 10, brand: "Currently Running", guest: "Nash Howe", desc: "Running apparel at the intersection of product, art, and storytelling: sourcing, manufacturing, pricing, and building a brand with intention.", duration: "48 min", date: "Dec 17, 2025", category: "Apparel", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 9, brand: "Almond Surfboards", guest: "Dave Allee", desc: "17 years of surfboard shaping: 1960s craft nostalgia, retail in Costa Mesa, custom orders, and stubbornly paddling in the same direction.", duration: "55 min", date: "Dec 15, 2025", category: "Consumer Products", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 8, brand: "Alec's Ice Cream", guest: "Alec Jaffe", desc: "Regenerative A2 dairy ice cream: rebuilding a factory in Sonoma, cold-chain logistics, ingredient costs, and Culture Cup going viral on TikTok.", duration: "47 min", date: "Dec 10, 2025", category: "Food & Beverage", spotify: "https://open.spotify.com/episode/2gd0C1A9PkMFQcvlLOZarE", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 7, brand: "Stonemaier Games", guest: "Jamey Stegmaier", desc: "From Kickstarter to $20-25M in revenue: tabletop game publishing, direct-to-consumer logistics, and bringing joy to tabletops worldwide.", duration: "52 min", date: "Dec 3, 2025", category: "Games & Leisure", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 6, brand: "Spring & Mulberry", guest: "Kathryn Shaw", desc: "Building a chocolate brand without refined sugar: from cancer diagnosis to CPG company, co-manufacturing, MOQs, cacao market chaos, and premium positioning in grocery.", duration: "48 min", date: "Nov 26, 2025", category: "Food & Beverage", spotify: "https://open.spotify.com/episode/61u5w7144ZpnG66LKxxyR5", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 5, brand: "Talea Beer Co", guest: "Tara Hankinson & LeAnn Darland", desc: "Co-founding a brewery: Navy to Google to beer, sourcing, taproom economics, and building a community-driven brand.", duration: "58 min", date: "Nov 19, 2025", category: "Food & Beverage", spotify: "https://open.spotify.com/episode/5lCiFstVMysfgLhA3CGzrZ", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 4, brand: "PF Candle Co", guest: "Kristen Pumphrey & Tom Neuberger", desc: "From Etsy shop to home fragrance brand: making everything in-house in LA, scaling production, and the husband-wife operating dynamic.", duration: "55 min", date: "Nov 12, 2025", category: "Home Goods", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 3, brand: "Le Puzz", guest: "Alistair Matthews & Michael Hunter", desc: "Artist-run jigsaw puzzles from Brooklyn: pandemic origins, sourcing from existing collections, and turning a hobby into a full-time business.", duration: "45 min", date: "Nov 12, 2025", category: "Games & Leisure", spotify: "https://open.spotify.com/episode/77Kr4eUEqgzzZnKlsum1AG", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 2, brand: "Alec's Ice Cream (Trailer)", guest: "Alec Jaffe", desc: "A preview of our conversation with Alec Jaffe, founder of the first certified regenerative A2-dairy ice cream brand in the country.", duration: "5 min", date: "Nov 7, 2025", category: "Food & Beverage", spotify: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
  { id: 1, brand: "Craighill", guest: "Zach Fried", desc: "Building a design-forward objects brand: sourcing globally, community-driven customer acquisition, retention strategies, and new product development.", duration: "50 min", date: "Nov 5, 2025", category: "Home Goods", spotify: "https://open.spotify.com/episode/7ev7LQodbBdFp1SAplFrhp", apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", youtube: "https://www.youtube.com/@UnitEconomicsPod" },
];

const CATEGORIES = ["All", ...new Set(EPISODES.map(e => e.category))].sort((a, b) => {
  if (a === "All") return -1;
  if (b === "All") return 1;
  return a.localeCompare(b);
});

const SpotifyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 10.2c-.1-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3.1-1.7-1.3-.1-2.6.8-3.2.8-.7 0-1.7-.8-2.8-.7-1.4 0-2.7.8-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7 1.3 0 1.7.7 2.8.7 1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.3 1.2-2.4 0 0-2.3-.9-2.4-3.4zM16.7 3.8c.6-.7 1-1.7.9-2.7-.8 0-1.9.6-2.5 1.3-.5.6-1 1.7-.9 2.6.9.1 1.9-.5 2.5-1.2z"/></svg>
);

const YouTubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);

function EpisodeCard({ ep, index }) {
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "28px 0",
        display: "grid",
        gridTemplateColumns: "48px 1fr auto",
        gap: "20px",
        alignItems: "start",
        opacity: 0,
        animation: `fadeUp 0.4s ease ${index * 0.03}s forwards`,
        cursor: "default",
      }}
    >
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        color: "rgba(255,255,255,0.3)",
        paddingTop: "4px",
        letterSpacing: "0.05em",
      }}>
        {String(ep.id).padStart(2, "0")}
      </div>

      <div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "11px",
          fontWeight: 500,
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "6px",
        }}>
          {ep.category}
        </div>
        <div style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: "22px",
          fontWeight: 400,
          lineHeight: 1.25,
          marginBottom: "4px",
          textTransform: "uppercase",
        }}>
          <a
            href={ep.spotify}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: ep.color || "#fff",
              textDecoration: "none",
            }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
          >
            {ep.brand}
          </a>
        </div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "15px",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "10px",
          fontWeight: 400,
        }}>
          {ep.guest}
        </div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "14px",
          color: "rgba(255,255,255,0.35)",
          lineHeight: 1.6,
          maxWidth: "640px",
        }}>
          {ep.desc}
        </div>

        <div style={{
          display: "flex",
          gap: "14px",
          marginTop: "14px",
          alignItems: "center",
        }}>
          <a href={ep.spotify} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.3)", transition: "color 0.2s", textDecoration: "none", lineHeight: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = "#1DB954"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          ><SpotifyIcon /></a>
          <a href={ep.apple} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.3)", transition: "color 0.2s", textDecoration: "none", lineHeight: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = "#9B59B6"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          ><AppleIcon /></a>
          <a href={ep.youtube} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.3)", transition: "color 0.2s", textDecoration: "none", lineHeight: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = "#FF0000"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          ><YouTubeIcon /></a>
        </div>
      </div>

      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        color: "rgba(255,255,255,0.25)",
        textAlign: "right",
        whiteSpace: "nowrap",
        paddingTop: "4px",
      }}>
        <div>{ep.date}</div>
        <div style={{ marginTop: "4px" }}>{ep.duration}</div>
      </div>
    </div>
  );
}

export default function UnitEconomics() {
  const [section, setSection] = useState("home");
  const [filter, setFilter] = useState("All");
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef(null);

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

  const filtered = filter === "All" ? EPISODES : EPISODES.filter(e => e.category === filter);

  return (
    <div style={{
      background: "#000",
      color: "#fff",
      minHeight: "100vh",
      fontFamily: "'Space Grotesk', sans-serif",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; }

        a { color: inherit; }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "border-color 0.3s, backdrop-filter 0.3s",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        background: scrolled ? "rgba(0,0,0,0.85)" : "transparent",
      }}>
        <div
          onClick={() => { setSection("home"); setFilter("All"); }}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{
            fontFamily: "'Anton', sans-serif",
            fontWeight: 400,
            fontSize: "18px",
            lineHeight: 1.05,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}>
            UNIT<br/>ECONOMICS
          </div>
          <div style={{
            width: "24px",
            height: "24px",
            border: "2px solid #fff",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "0",
          }}>
            <div style={{ background: "#fff" }} />
            <div style={{ background: "#fff" }} />
            <div style={{ background: "transparent" }} />
            <div style={{ background: "#fff" }} />
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "32px",
          alignItems: "center",
        }}>
          {["home", "episodes", "about", "contact"].map(s => (
            <button
              key={s}
              onClick={() => { setSection(s); if (s !== "episodes") setFilter("All"); }}
              style={{
                background: "none",
                border: "none",
                color: section === s ? "#fff" : "rgba(255,255,255,0.4)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "color 0.2s",
                padding: "4px 0",
                borderBottom: section === s ? "1px solid rgba(255,255,255,0.5)" : "1px solid transparent",
              }}
            >
              {s === "episodes" ? "Listen" : s}
            </button>
          ))}
        </div>
      </nav>

      {/* CONTENT */}
      <div ref={contentRef} style={{
        flex: 1,
        overflow: "auto",
        scrollBehavior: "smooth",
      }}>

        {/* HOME */}
        {section === "home" && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            {/* HERO */}
            <div style={{
              padding: "120px 40px 56px",
            }}>
              <h1 style={{
                fontFamily: "'Anton', sans-serif",
                fontWeight: 400,
                fontSize: "clamp(48px, 8vw, 110px)",
                lineHeight: 1.0,
                letterSpacing: "0.01em",
                textTransform: "uppercase",
                marginBottom: "40px",
              }}>
                Exploring the<br/>hidden complexity<br/>behind every industry.
              </h1>
              <p style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(16px, 2vw, 20px)",
                fontWeight: 300,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.65,
                maxWidth: "720px",
              }}>
                A show investigating familiar brands, the products they make, and the people shaping them — with a focus on the decisions, economics, and mechanics behind the scenes.
              </p>

              <div style={{
                display: "flex",
                gap: "16px",
                marginTop: "48px",
              }}>
                <a href="https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "12px 20px", border: "1px solid rgba(255,255,255,0.2)",
                    textDecoration: "none", color: "#fff", fontSize: "13px",
                    fontWeight: 500, letterSpacing: "0.04em", transition: "all 0.2s",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#1DB954"; e.currentTarget.style.color = "#1DB954"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}
                ><SpotifyIcon /> Spotify</a>
                <a href="https://podcasts.apple.com/us/podcast/unit-economics/id1856362735" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "12px 20px", border: "1px solid rgba(255,255,255,0.2)",
                    textDecoration: "none", color: "#fff", fontSize: "13px",
                    fontWeight: 500, letterSpacing: "0.04em", transition: "all 0.2s",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#9B59B6"; e.currentTarget.style.color = "#9B59B6"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}
                ><AppleIcon /> Apple Podcasts</a>
                <a href="https://www.youtube.com/@UnitEconomicsPod" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "12px 20px", border: "1px solid rgba(255,255,255,0.2)",
                    textDecoration: "none", color: "#fff", fontSize: "13px",
                    fontWeight: 500, letterSpacing: "0.04em", transition: "all 0.2s",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#FF0000"; e.currentTarget.style.color = "#FF0000"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}
                ><YouTubeIcon /> YouTube</a>
              </div>
            </div>

            {/* LATEST EPISODES PREVIEW */}
            <div style={{
              padding: "0 40px 80px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                paddingTop: "32px",
                marginBottom: "8px",
              }}>
                <h2 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                }}>
                  Latest Episodes
                </h2>
                <button
                  onClick={() => setSection("episodes")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
                >
                  View all →
                </button>
              </div>

              {EPISODES.slice(0, 5).map((ep, i) => (
                <EpisodeCard key={ep.id} ep={ep} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* EPISODES */}
        {section === "episodes" && (
          <div style={{ padding: "48px 40px 80px", animation: "fadeIn 0.4s ease" }}>
            <h2 style={{
              fontFamily: "'Anton', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(32px, 4vw, 48px)",
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              marginBottom: "32px",
            }}>
              Episodes
            </h2>

            {/* FILTER */}
            <div style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "32px",
            }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  style={{
                    background: filter === cat ? "#fff" : "transparent",
                    color: filter === cat ? "#000" : "rgba(255,255,255,0.4)",
                    border: filter === cat ? "1px solid #fff" : "1px solid rgba(255,255,255,0.12)",
                    padding: "6px 14px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              color: "rgba(255,255,255,0.2)",
              marginBottom: "16px",
            }}>
              {filtered.length} episode{filtered.length !== 1 ? "s" : ""}
            </div>

            {filtered.map((ep, i) => (
              <EpisodeCard key={ep.id} ep={ep} index={i} />
            ))}
          </div>
        )}

        {/* ABOUT */}
        {section === "about" && (
          <div style={{ padding: "80px 40px", maxWidth: "680px", animation: "fadeIn 0.5s ease" }}>
            <h2 style={{
              fontFamily: "'Anton', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(32px, 4vw, 48px)",
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              marginBottom: "40px",
            }}>
              About
            </h2>

            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "24px",
              fontWeight: 400,
              lineHeight: 1.45,
              marginBottom: "40px",
              color: "rgba(255,255,255,0.85)",
            }}>
              Josh Stabinsky lives in San Francisco and spends a lot of time drinking coffee. He loves consumer packaged goods. And dogs.
            </div>

            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "15px",
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.45)",
              marginBottom: "40px",
            }}>
              Unit Economics is a long-form interview podcast that digs into how products are actually designed, manufactured, priced, and distributed. Each episode is a conversation with a founder, operator, or builder about the decisions, constraints, and tradeoffs behind their business. The show covers industries from food and beverage to hardware, games, apparel, and beyond.
            </div>

            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "15px",
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.45)",
            }}>
              New episodes every week. Available on Spotify, Apple Podcasts, and YouTube.
            </div>
          </div>
        )}

        {/* CONTACT */}
        {section === "contact" && (
          <div style={{ padding: "80px 40px", maxWidth: "680px", animation: "fadeIn 0.5s ease" }}>
            <h2 style={{
              fontFamily: "'Anton', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(32px, 4vw, 48px)",
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              marginBottom: "40px",
            }}>
              Contact
            </h2>

            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "17px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.55)",
              marginBottom: "32px",
            }}>
              Guest suggestions, press inquiries, sponsorship, or just want to say hi?
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
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#fff"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"}
            >
              hello@uepod.com
            </a>

            <div style={{
              display: "flex",
              gap: "20px",
              marginTop: "48px",
            }}>
              {[
                { icon: <SpotifyIcon />, url: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", label: "Spotify" },
                { icon: <AppleIcon />, url: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", label: "Apple" },
                { icon: <YouTubeIcon />, url: "https://www.youtube.com/@UnitEconomicsPod", label: "YouTube" },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    transition: "color 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "48px 40px 40px",
        }}>
          <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <h3 style={{
              fontFamily: "'Anton', sans-serif",
              fontWeight: 400,
              fontSize: "18px",
              textTransform: "uppercase",
              marginBottom: "16px",
              letterSpacing: "0.02em",
            }}>Follow</h3>
            <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
              {[
                { icon: <SpotifyIcon />, url: "https://open.spotify.com/show/6uN9t3y2TvEkiYFZfl317F", hc: "#1DB954" },
                { icon: <YouTubeIcon />, url: "https://www.youtube.com/@UnitEconomicsPod", hc: "#FF0000" },
                { icon: <AppleIcon />, url: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735", hc: "#9B59B6" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>, url: "https://instagram.com/uniteconomicspod", hc: "#E1306C" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>, url: "https://tiktok.com/@uniteconomicspod", hc: "#fff" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, url: "https://linkedin.com/company/unit-economics-podcast", hc: "#0A66C2" },
              ].map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    transition: "color 0.2s",
                    textDecoration: "none",
                    lineHeight: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = link.hc}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "20px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.04em",
            textAlign: "right",
          }}>
            © 2025–2026 Unit Economics Podcast
          </div>
        </footer>
      </div>
    </div>
  );
}
