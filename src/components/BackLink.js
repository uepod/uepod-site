import { useLayoutEffect, useState } from "react";
import { backLinkFromSearch } from "../lib/fromLink";

const FALLBACK = { href: "/#episodes", label: "← All episodes" };

export default function BackLink() {
  const [link, setLink] = useState(FALLBACK);

  useLayoutEffect(() => {
    const next = backLinkFromSearch(window.location.search, window.location.pathname);
    setLink(next || FALLBACK);
  }, []);

  return (
    <a className="back-link" href={link.href}>
      {link.label}
    </a>
  );
}
