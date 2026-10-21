const test = require("node:test");
const assert = require("node:assert/strict");

const { htmlToBlocks } = require("../src/lib/episodePage");
const {
  OFFER_URL,
  RHO_URL,
  SPONSOR_READ,
  descriptionBlocksForPage,
  paragraphMentionsSponsor,
  sponsorReadPlainText,
  stripSponsorBlocks,
  stripSponsorText,
} = require("../src/lib/sponsorRead");

const CANONICAL =
  "This episode is brought to you in part by Rho, a paid partner of the show. Rho is the modern banking platform built for the AI era. Startups and growth-stage companies can open accounts in minutes, issue cards, manage expenses, pay bills, and close the books, all in one connected platform, backed by real human support that founders love. Right now, qualified Unit Economics listeners can get $100 when they open and fund an account at uepod.com/rho. Terms apply.";

test("the site copy is one paragraph with the two sponsor links", () => {
  assert.equal(sponsorReadPlainText(), CANONICAL);
  const links = SPONSOR_READ.filter((part) => part.href);
  assert.deepEqual(
    links.map((part) => [part.text, part.href]),
    [
      ["Rho", RHO_URL],
      ["uepod.com/rho", OFFER_URL],
    ]
  );
  assert.equal(RHO_URL, "https://rho.co");
  assert.equal(OFFER_URL, "https://uepod.com/rho");
  assert.equal(
    SPONSOR_READ.filter((part) => part.text === "Rho" && part.href).length,
    1
  );
});

test("a slightly reworded sponsor read is removed and show notes stay", () => {
  const reworded =
    "Quick note: Rho is picking up part of this episode. Qualified listeners can still get $100 when they open and fund an account via uepod.com/rho. Some terms apply.";
  const notes = "Damian started Primis with a single shipment of olive oil.";
  const blocks = stripSponsorBlocks([
    [{ text: notes }],
    [{ text: CANONICAL }],
    [
      { text: "Today's episode is supported by " },
      { text: "Rho", href: "rho.co" },
      { text: ". Details at uepod.com/rho." },
    ],
    [{ text: reworded }],
    [{ text: "A thanks to Rho for backing the show." }],
    [{ text: "The offer link is uepod.com/rho." }],
  ]);

  assert.deepEqual(blocks, [[{ text: notes }]]);
  assert.equal(paragraphMentionsSponsor(reworded), true);
  assert.equal(paragraphMentionsSponsor(notes), false);
  assert.equal(paragraphMentionsSponsor("Freight, harvest, and retail expansion."), false);
  assert.equal(paragraphMentionsSponsor("The Rhoades family recipe."), false);

  const sheetDesc = stripSponsorText(
    `Building an olive oil import brand from a single shipment.\n\n${reworded}`
  );
  assert.equal(sheetDesc, "Building an olive oil import brand from a single shipment.");
});

test("RSS sponsor markup is dropped even when the anchors are not real links", () => {
  const html = [
    "<p>I learned a lot during my conversation with Damian, and I hope you enjoy it as much as I did.</p>",
    '<p>This week\'s episode is made possible by <a href="rho.co" target="_blank"><strong>Rho</strong></a>, a paid partner. Fund an account at <a href="https://uepod.com/rho">uepod.com/rho</a>.</p>',
  ].join("");
  const episode = {
    descriptionBlocks: htmlToBlocks(html),
    desc: "Short olive oil description.",
  };

  const blocks = descriptionBlocksForPage(episode);
  assert.equal(blocks.length, 1);
  assert.equal(
    blocks[0].map((part) => part.text).join(""),
    "I learned a lot during my conversation with Damian, and I hope you enjoy it as much as I did."
  );
  assert.equal(
    blocks.some((parts) => paragraphMentionsSponsor(parts.map((part) => part.text).join(""))),
    false
  );
});
