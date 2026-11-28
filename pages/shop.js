import { useState } from "react";
import Head from "next/head";
import SiteChrome from "../src/components/SiteChrome";

// MOCKUP ONLY. Not wired to Stripe. Buy button would point at a Stripe Payment Link.
const PRODUCT = {
  name: "Unit Economics Dad Cap",
  color: "Black",
  price: 40,
  madeCount: 25,
  details: [
    "Soft brushed cotton",
    "Unstructured crown, relaxed fit",
    "Adjustable strap with brass buckle",
    "One size fits most",
  ],
};

const PHOTOS = [
  { src: "/shop/hat-front.png", label: "Front", alt: "Unit Economics Dad Cap in black, three-quarter front view with white embroidered logo" },
  { src: "/shop/hat-front-straight.png", label: "Front, straight on", alt: "Unit Economics Dad Cap in black, straight-on front view with white embroidered logo" },
];

export default function ShopPage() {
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  return (
    <>
      <Head>
        <title>Shop | Unit Economics</title>
        <meta name="robots" content="noindex" />
      </Head>
      <SiteChrome>
        <article className="partners-page shop-page">
          <h1>Shop</h1>
          <p className="partners-intro partners-copy">
            A small run of hats for the show, printed on{" "}
            <a
              className="shop-copy-link"
              href="https://www.byopenhouse.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Openhouse
            </a>{" "}
            blanks.
          </p>

          <section className="shop-product">
            <div className="shop-photo">
              <img src={PHOTOS[photo].src} alt={PHOTOS[photo].alt} />
              <div className="shop-thumbs">
                {PHOTOS.map((p, i) => (
                  <button
                    key={p.src}
                    type="button"
                    className={i === photo ? "active" : ""}
                    onClick={() => setPhoto(i)}
                    aria-label={p.label}
                  >
                    <img src={p.src} alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="shop-info">
              <p className="shop-kicker">Limited run · {PRODUCT.madeCount} made</p>
              <h2 className="shop-name">{PRODUCT.name}</h2>
              <p className="shop-color">{PRODUCT.color}</p>
              <p className="shop-price">${PRODUCT.price}</p>

              <ul className="shop-details">
                {PRODUCT.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>

              <p className="shop-note">
                Each hat is embroidered individually, so stitching may vary slightly from the photos.
              </p>

              <div className="shop-buy-row">
                <div className="shop-qty" aria-label="Quantity">
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty(Math.min(3, qty + 1))} aria-label="Increase">+</button>
                </div>
                <a className="shop-buy" href="#">
                  Buy · ${PRODUCT.price * qty}
                </a>
              </div>

              <p className="shop-note shop-reach">
                Feel free to{" "}
                <a href="mailto:hello@uepod.com">reach out</a>
                {" "}directly to place an order as well.
              </p>

              <p className="partners-disclosure">
                Secure checkout with Stripe. Flat-rate US shipping, ships within 3 business days.
              </p>
            </div>
          </section>

          <section className="shop-soon">
            <p className="shop-kicker">Coming soon</p>
            <p className="partners-copy">Nylon Dad Cap, black. Also 25 made.</p>
          </section>
        </article>
      </SiteChrome>
    </>
  );
}
