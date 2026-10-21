import { SPONSOR_READ } from "../lib/sponsorRead";

/**
 * One paragraph, same markup as the other About copy. No heading.
 * Links use the description link style so the type stays Space Grotesk.
 */
export default function SponsorRead() {
  return (
    <p>
      {SPONSOR_READ.map((part, index) =>
        part.href ? (
          <a
            key={part.href}
            className="episode-guest-link"
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {part.text}
          </a>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </p>
  );
}
