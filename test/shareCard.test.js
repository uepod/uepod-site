const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const {
  SHARE_WIDTH,
  SHARE_HEIGHT,
  containRect,
  edgeColor,
  artworkUrlForPublicEpisode,
  isFetchableImageUrl,
  composeShareCard,
} = require("../src/lib/shareCard");

test("a square cover is contained, not cropped, in the wide card", () => {
  const box = containRect(3000, 3000);
  assert.equal(box.canvasWidth, SHARE_WIDTH);
  assert.equal(box.canvasHeight, SHARE_HEIGHT);
  assert.equal(box.width, 630);
  assert.equal(box.height, 630);
  assert.equal(box.left, 285);
  assert.equal(box.top, 0);
});

test("side bars use the color at the left and right edges", () => {
  const width = 4;
  const height = 2;
  const rgba = Buffer.from([
    10, 20, 30, 255, 0, 0, 0, 255, 0, 0, 0, 255, 10, 20, 30, 255,
    12, 22, 32, 255, 0, 0, 0, 255, 0, 0, 0, 255, 12, 22, 32, 255,
  ]);
  assert.deepEqual(edgeColor(rgba, width, height, 4), { r: 11, g: 21, b: 31 });
});

test("a sheet row with listen links and no RSS item has no share artwork", () => {
  const episodes = [
    {
      slug: "fora-evan-frank",
      published: false,
      image: "https://cdn.example/fora.jpg",
      spotify: "https://open.spotify.com/episode/abc",
      youtube: "https://youtu.be/abc",
      apple: "https://podcasts.apple.com/us/podcast/unit-economics/id1856362735?i=1",
    },
    {
      slug: "light-joe-hollier",
      published: true,
      image: "https://cdn.example/light.jpg",
    },
  ];
  assert.equal(artworkUrlForPublicEpisode(episodes, "fora-evan-frank"), null);
  assert.equal(
    artworkUrlForPublicEpisode(episodes, "light-joe-hollier"),
    "https://cdn.example/light.jpg"
  );
  assert.equal(artworkUrlForPublicEpisode(episodes, "missing"), null);
});

test("only public https artwork URLs are fetched", () => {
  assert.equal(isFetchableImageUrl("https://d3t3ozftmdmh3i.cloudfront.net/a.jpg"), true);
  assert.equal(isFetchableImageUrl("http://cdn.example/a.jpg"), false);
  assert.equal(isFetchableImageUrl("https://127.0.0.1/a.jpg"), false);
  assert.equal(isFetchableImageUrl("https://localhost/a.jpg"), false);
  assert.equal(isFetchableImageUrl("not a url"), false);
});

test("the composed card is 1200x630 and keeps the full square", async () => {
  const source = await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 3,
      background: { r: 200, g: 40, b: 20 },
    },
  })
    .jpeg()
    .toBuffer();

  const card = await composeShareCard(source);
  const meta = await sharp(card).metadata();
  assert.equal(meta.format, "jpeg");
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 630);

  const { data, info } = await sharp(card).raw().toBuffer({ resolveWithObject: true });
  const pixel = (x, y) => {
    const index = (y * info.width + x) * info.channels;
    return [data[index], data[index + 1], data[index + 2]];
  };
  const side = pixel(10, 315);
  const center = pixel(600, 315);
  for (const channel of [0, 1, 2]) {
    assert.ok(Math.abs(side[channel] - [200, 40, 20][channel]) < 8);
    assert.ok(Math.abs(center[channel] - [200, 40, 20][channel]) < 8);
  }
});
