import { useEffect, useState } from "react";

// Only use the container if it actually scrolls; the homepage's .home-scroll
// grows to its content, so the window does the scrolling there.
function getScroller() {
  const el = document.querySelector(".site-scroll, .home-scroll");
  return el && el.scrollHeight > el.clientHeight + 1 ? el : null;
}

export default function TopLink() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = document.querySelector(".site-scroll, .home-scroll");
    const update = () => {
      const scroller = getScroller();
      const phone = window.matchMedia("(max-width: 768px)").matches;
      const top = scroller ? scroller.scrollTop : window.scrollY;
      const height = scroller ? scroller.clientHeight : window.innerHeight;
      setVisible(!phone && top >= height * 1.5);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    if (container) container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      if (container) container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="glossary-top-slot">
      <a
        className={`glossary-top${visible ? " is-visible" : ""}`}
        href="#top"
        aria-hidden={visible ? undefined : true}
        tabIndex={visible ? 0 : -1}
        onClick={(event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          const scroller = getScroller();
          if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        ↑ Top
      </a>
    </div>
  );
}
