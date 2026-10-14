import { useEffect, useState } from "react";

function getScroller() {
  return document.querySelector(".site-scroll, .home-scroll");
}

export default function TopLink() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scroller = getScroller();
    const target = scroller || window;
    const update = () => {
      const phone = window.matchMedia("(max-width: 768px)").matches;
      const top = scroller ? scroller.scrollTop : window.scrollY;
      const height = scroller ? scroller.clientHeight : window.innerHeight;
      setVisible(!phone && top >= height * 1.5);
    };
    update();
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      target.removeEventListener("scroll", update);
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
