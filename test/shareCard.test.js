const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const {
  SHARE_WIDTH,
  SHARE_HEIGHT,
  COVER_SIZE,
  BLUR_SIGMA,
  BACKGROUND_BRIGHTNESS,
  MEDIAN_BLEND,
  medianColor,
  coverPlacement,
  artworkUrlForPublicEpisode,
  isFetchableImageUrl,
  composeShareCard,
} = require("../src/lib/shareCard");

test("the sharp cover sits at 400×400 inside Reddit's visible band", () => {
  const place = coverPlacement();
  assert.equal(SHARE_WIDTH, 1200);
  assert.equal(SHARE_HEIGHT, 630);
  assert.equal(COVER_SIZE, 400);
  assert.equal(BLUR_SIGMA, 100);
  assert.equal(BACKGROUND_BRIGHTNESS, 0.9);
  assert.equal(MEDIAN_BLEND, 0.6);
  assert.ok(COVER_SIZE / SHARE_HEIGHT >= 0.62);
  assert.ok(COVER_SIZE / SHARE_HEIGHT <= 0.65);
  // A 400px cover cannot be canvas-centered and still clear Reddit's title
  // bar, so it is raised to the top of the visible 500px crop (top = 65).
  assert.deepEqual(place, { width: 400, height: 400, left: 400, top: 65 });
  const cropTop = Math.round((SHARE_HEIGHT - 500) / 2);
  const barTop = cropTop + 400;
  assert.equal(cropTop, 65);
  assert.equal(barTop, 465);
  assert.ok(place.top >= cropTop, "cover starts below the cropped top edge");
  assert.ok(place.top + place.height <= barTop, "the whole cover stays above Reddit's title bar");
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

test("median color is taken per channel", () => {
  const raw = Buffer.from([
    10, 0, 0,
    30, 0, 0,
    20, 5, 9,
  ]);
  assert.deepEqual(medianColor(raw, 3, 1, 3), { r: 20, g: 0, b: 0 });
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
  const blended = original.map((channel) =>
    Math.round(channel * BACKGROUND_BRIGHTNESS * (1 - MEDIAN_BLEND) + channel * MEDIAN_BLEND)
  );
  const side = pixel(10, 315);
  const center = pixel(600, 315);
  for (let channel = 0; channel < 3; channel++) {
    assert.ok(Math.abs(center[channel] - original[channel]) < 12);
    assert.ok(Math.abs(side[channel] - blended[channel]) < 12);
  }
});

test("a black mark on a bold cover does not stay a dark blotch", async () => {
  const orange = { r: 255, g: 90, b: 0 };
  const base = await sharp({
    create: { width: 400, height: 400, channels: 3, background: orange },
  })
    .png()
    .toBuffer();
  const marked = await sharp(base)
    .composite([
      {
        input: await sharp({
          create: { width: 80, height: 80, channels: 3, background: { r: 0, g: 0, b: 0 } },
        })
          .png()
          .toBuffer(),
        left: 160,
        top: 40,
      },
    ])
    .jpeg()
    .toBuffer();

  const card = await composeShareCard(marked);
  const { data, info } = await sharp(card).raw().toBuffer({ resolveWithObject: true });
  const pixel = (x, y) => {
    const index = (y * info.width + x) * info.channels;
    return [data[index], data[index + 1], data[index + 2]];
  };
  const side = pixel(20, 40);
  assert.ok(side[0] > 180, `side red ${side[0]}`);
  assert.ok(side[1] < 140, `side green ${side[1]}`);
  assert.ok(side[2] < 40, `side blue ${side[2]}`);
});
