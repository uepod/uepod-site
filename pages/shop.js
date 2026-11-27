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

export default function ShopPage() {
  const [qty, setQty] = useState(1);
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
            A small run of hats for the show. When they're gone, they're gone.
          </p>

          <section className="shop-product">
            <div className="shop-photo">
              <img src="/shop/hat-placeholder.svg" alt="Unit Economics Dad Cap in black" />
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
