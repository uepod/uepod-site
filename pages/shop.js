import Head from "next/head";
import SiteChrome from "../src/components/SiteChrome";

// Local shop-mockup. BUY points at the live Stripe Payment Link.
// Not pushed, deployed, or opened as a PR.
const PAYMENT_LINK = "https://buy.stripe.com/8x24gr0WpbMf0mW9qgcZa00";
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
  return (
    <>
      <Head>
        <title>Shop | Unit Economics</title>
        <meta name="robots" content="noindex" />
      </Head>
      <SiteChrome>
        <article className="partners-page shop-page shop-layout-b">
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
              <img
                src="/shop/hat-front.png"
                alt="Unit Economics Dad Cap in black, three-quarter front view with white embroidered logo"
              />
            </div>

            <div className="shop-info">
              <p className="shop-kicker">Limited run · {PRODUCT.madeCount} made</p>
              <h2 className="shop-name">Unit Economics<br />Dad Cap</h2>
              <p className="shop-color">{PRODUCT.color}</p>
              <p className="shop-price">${PRODUCT.price}</p>
              <p className="shop-note shop-limit">Limit one per customer.</p>

              <ul className="shop-details">
                {PRODUCT.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>

              <p className="shop-note">
                Each hat is embroidered individually, so stitching may vary slightly from the photos.
              </p>

              <div className="shop-buy-row">
                <a className="shop-buy" href={PAYMENT_LINK}>
                  Buy · ${PRODUCT.price}
                </a>
              </div>

              <p className="shop-note shop-reach">
                Feel free to{" "}
                <a href="mailto:hello@uepod.com">reach out</a>
                {" "}directly to place an order as well.
              </p>

              <p className="partners-disclosure">
                Secure checkout with Stripe. Free shipping in the continental US, ships within 3 business days.
              </p>
            </div>
          </section>
        </article>
      </SiteChrome>
    </>
  );
}
