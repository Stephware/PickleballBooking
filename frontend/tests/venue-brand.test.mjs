import assert from "node:assert/strict";
import test from "node:test";
import { resolvePresentationBrand, RESERVE_LOGO, RESERVE_PRIMARY,
  RESERVE_SECONDARY, RESERVE_VENUE_NAME } from "../lib/venue-brand.ts";

const base = { venueName: "Demo Venue", venueSlug: "demo", timezone: "Asia/Manila",
  currency: "PHP", logoUrl: "https://example.org/logo.png",
  primaryColor: "#176e4b", secondaryColor: "#f2f7f4" };

test("the approved Reserve look is bundled without affecting backend data", () => {
  const venue = resolvePresentationBrand(base, {});
  assert.equal(venue.logoUrl, RESERVE_LOGO);
  assert.equal(venue.primaryColor, RESERVE_PRIMARY);
  assert.equal(venue.secondaryColor, RESERVE_SECONDARY);
  assert.equal(venue.venueName, "Pickleball Reserve");
  assert.equal(venue.venueName, RESERVE_VENUE_NAME);
  assert.equal(venue.venueSlug, "demo", "The official name must not change stable venue slugs");
  assert.equal(venue.timezone, "Asia/Manila");
});

test("other venue deployments can keep API brand, including the real venue name", () => {
  assert.deepEqual(resolvePresentationBrand(base, { mode: "api" }), base);
  const own = resolvePresentationBrand(base, {
    primary: "#112233", secondary: "#fefefe", logoPath: "/venue/other.png",
  });
  assert.equal(own.primaryColor, "#112233");
  assert.equal(own.secondaryColor, "#fefefe");
  assert.equal(own.logoUrl, "/venue/other.png");
});

test("unsafe brand overrides are refused", () => {
  const safe = resolvePresentationBrand(base, {
    primary: "red", secondary: "#12345g", logoPath: "//host/evil.jpg",
  });
  assert.equal(safe.primaryColor, RESERVE_PRIMARY);
  assert.equal(safe.secondaryColor, RESERVE_SECONDARY);
  assert.equal(safe.logoUrl, RESERVE_LOGO);
  assert.equal(resolvePresentationBrand(base, { logoPath: "api" }).logoUrl, base.logoUrl);
});
