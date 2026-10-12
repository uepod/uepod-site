import { categoryPath } from "../lib/categories";
import { formatEpisodeNumber } from "../lib/episodePage";
import { withFrom } from "../lib/fromLink";

function CardWords({ text }) {
  const parts = String(text || "").split(/(\s+)/);
  return parts.map((part, index) =>
    part.trim() ? (
      <span key={`${index}-${part}`} className="listing-word">
        {part}
      </span>
    ) : (
      part
    )
  );
}

function guestLines(guest) {
  const text = String(guest || "").trim();
  if (!text.includes("&")) return text ? [text] : [];
  const parts = text.split("&");
  const lines = [];
  parts.forEach((part, index) => {
    const name = part.trim();
    if (!name) return;
    lines.push(index < parts.length - 1 ? `${name} &` : name);
  });
  return lines.length ? lines : [text];
}

export default function EpisodeCard({ episode, fromPath, fromName }) {
  const number = formatEpisodeNumber(episode.id);
  const lines = guestLines(episode.guest);
  const episodeHref = withFrom(`/episodes/${episode.slug}`, fromPath, fromName);
  const brand = episode.brand || episode.title || "";
  const when = [episode.date, episode.duration].filter(Boolean);

  return (
    <article className="listing-card">
      <a className="listing-card-link" href={episodeHref} aria-label={brand || "Episode"} />
      <div className="listing-card-body">
        {number ? <div className="episode-number listing-number">{number}</div> : null}
        {episode.category ? (
          <a className="category-label listing-category" href={withFrom(categoryPath(episode.category), fromPath, fromName)}>
            {episode.category}
          </a>
        ) : null}
        <h2>
          <a className="listing-clamp" href={episodeHref} title={brand}>
            <CardWords text={brand} />
          </a>
        </h2>
        {lines.length ? (
          <a className="listing-guest listing-clamp" href={episodeHref} title={episode.guest || ""}>
            {lines.map((line, index) => (
              <span key={line}>
                {index > 0 ? <br /> : null}
                <CardWords text={line} />
              </span>
            ))}
          </a>
        ) : null}
        {when.length ? (
          <div className="listing-meta">
            {when.map((bit) => (
              <span key={bit}>{bit}</span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
