import Head from "next/head";
import SiteChrome from "../src/components/SiteChrome";
import { SITE_URL } from "../src/lib/episodePage";
import partners from "../data/partners.json";

const TITLE = "Partners | Unit Economics";
const DESCRIPTION = "The companies that help make Unit Economics possible.";
const CANONICAL = `${SITE_URL}/partners`;

function trackPartnerClick(partner, link) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "partner_click", {
      partner: partner.id,
      link,
    });
  }
}

export default function PartnersPage() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta name="robots" content="index, follow" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:site_name" content="Unit Economics" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
      </Head>
      <SiteChrome>
        <article className="partners-page">
          <h1>Partners</h1>
          <p className="partners-intro partners-copy">{DESCRIPTION}</p>
          <ul className="partners-list">
            {partners.map((partner) => (
              <li key={partner.id}>
                {partner.logo ? (
                  <a
                    className="partners-logo"
                    href={partner.href}
                    onClick={() => trackPartnerClick(partner, "logo")}
                  >
                    <img src={partner.logo} alt={partner.name} width="409" height="182" />
                  </a>
                ) : (
                  <h2 className="partners-name episode-terms-label">{partner.name}</h2>
                )}
                <p className="partners-copy">{partner.description}</p>
                <p className="partners-copy">{partner.offer}</p>
                <a
                  className="partners-link"
                  href={partner.href}
                  onClick={() => trackPartnerClick(partner, "learn_more")}
                >
                  {partner.linkLabel}
                </a>
                <p className="partners-disclosure">{partner.disclosure}</p>
              </li>
            ))}
          </ul>
        </article>
      </SiteChrome>
    </>
  );
}
