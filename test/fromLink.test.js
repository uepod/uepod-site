const test = require("node:test");
const assert = require("node:assert/strict");
const { withFrom, backLinkFromSearch } = require("../src/lib/fromLink");

test("in-app links remember the page they came from", () => {
  assert.equal(
    withFrom("/category/food-beverage", "/topics/manufacturing", "Manufacturing"),
    "/category/food-beverage?from=%2Ftopics%2Fmanufacturing&fromName=Manufacturing"
  );
  assert.equal(
    backLinkFromSearch(
      "?from=%2Ftopics%2Fmanufacturing&fromName=Manufacturing",
      "/category/food-beverage"
    ).label,
    "← Back to Manufacturing"
  );
  assert.equal(
    backLinkFromSearch(
      "?from=%2Ftopics%2Fmanufacturing&fromName=Manufacturing",
      "/category/food-beverage"
    ).href,
    "/topics/manufacturing"
  );
  assert.equal(backLinkFromSearch("", "/episodes/mikeys-pies-mikey-deegan"), null);
  assert.equal(
    backLinkFromSearch("?from=https://evil.example&fromName=Manufacturing", "/topics/manufacturing"),
    null
  );
  assert.equal(
    backLinkFromSearch("?from=//evil.example/topics/manufacturing&fromName=Manufacturing", "/"),
    null
  );
  assert.equal(withFrom("https://evil.example", "/topics/manufacturing", "Manufacturing"), "https://evil.example");
});
