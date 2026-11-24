const test = require("node:test");
const assert = require("node:assert/strict");

const { htmlToBlocks } = require("../src/lib/episodePage");
const {
  descriptionBlocksForPage,
  paragraphMentionsSponsor,
  stripSponsorBlocks,
  stripSponsorText,
} = require("../src/lib/sponsorRead");

const RHO =
  "This episode is brought to you in part by Rho, a paid partner of the show. Right now, qualified Unit Economics listeners can get $100 when they open and fund an account at uepod.com/rho. Terms apply.";

test("card blurbs and related notes can drop a sponsor paragraph without touching show notes", () => {
  const reworded =
    "Quick note: Rho is picking up part of this episode. Qualified listeners can still get $100 when they open and fund an account via uepod.com/rho. Some terms apply.";
  const notes = "Damian started Primis with a single shipment of olive oil.";
  const blocks = stripSponsorBlocks([
    [{ text: notes }],
    [{ text: RHO }],
    [{ text: reworded }],
    [{ text: "A thanks to Rho for backing the show." }],
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

test("the About section keeps RSS sponsor paragraphs, order, and links", () => {
  const html = [
    "<p>I learned a lot during my conversation with Damian, and I hope you enjoy it as much as I did.</p>",
    '<p>This episode is brought to you in part by <a href="https://www.rho.co/" target="_blank"><strong>Rho</strong></a>, a paid partner. Fund an account at <a href="https://uepod.com/rho">uepod.com/rho</a>.</p>',
    '<p>This episode is also brought to you in part by <a href="https://runway.com/"><strong>Runway</strong></a>. See <a href="https://uepod.com/runway">uepod.com/runway</a>.</p>',
  ].join("");
  const descriptionBlocks = htmlToBlocks(html);
  const blocks = descriptionBlocksForPage({
    descriptionBlocks,
    desc: "Short olive oil description.",
  });

  assert.equal(blocks, descriptionBlocks);
  assert.equal(blocks.length, 3);
  assert.deepEqual(
    blocks[1].filter((part) => part.href).map((part) => [part.text, part.href]),
    [
      ["Rho", "https://www.rho.co/"],
      ["uepod.com/rho", "https://uepod.com/rho"],
    ]
  );
  assert.deepEqual(
    blocks[2].filter((part) => part.href).map((part) => [part.text, part.href]),
    [
      ["Runway", "https://runway.com/"],
      ["uepod.com/runway", "https://uepod.com/runway"],
    ]
  );
});
