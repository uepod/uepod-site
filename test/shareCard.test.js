const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const {
  SHARE_WIDTH,
  SHARE_HEIGHT,
  COVER_SIZE,
  BLUR_SIGMA,
  BACKGROUND_BRIGHTNESS,
  coverPlacement,
  artworkUrlForPublicEpisode,
  isFetchableImageUrl,
  composeShareCard,
} = require("../src/lib/shareCard");

test("the sharp cover sits centered at 570×570", () => {
  const place = coverPlacement();
  assert.equal(SHARE_WIDTH, 1200);
  assert.equal(SHARE_HEIGHT, 630);
  assert.equal(COVER_SIZE, 570);
  assert.equal(BLUR_SIGMA, 40);
  assert.equal(BACKGROUND_BRIGHTNESS, 0.85);
  assert.deepEqual(place, { width: 570, height: 570, left: 315, top: 30 });
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

test("the card blurs and darkens the background and keeps a sharp cover", async () => {
  const source = await sharp({
    create: {
      width: 400,
      height: 400,
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
  const original = [200, 40, 20];
  const darkened = original.map((channel) => Math.round(channel * BACKGROUND_BRIGHTNESS));
  const side = pixel(10, 315);
  const center = pixel(600, 315);
  for (let channel = 0; channel < 3; channel++) {
    assert.ok(Math.abs(center[channel] - original[channel]) < 12);
    assert.ok(Math.abs(side[channel] - darkened[channel]) < 12);
  }
});
