import assert from "node:assert/strict";
import test from "node:test";
import { VENUE_PRESETS, resolveVenueTemplate, applyVenuePreset,
  imageBelongsToVenue } from "../lib/venue-presets.ts";
import { resolvePresentationBrand } from "../lib/venue-brand.ts";
import { venueThemeStyle } from "../lib/venue-theme-style.ts";

const base = { venueName:"Synthetic Venue", venueSlug:"disposable-demo",
  timezone:"Asia/Manila",currency:"PHP",logoUrl:null,
  primaryColor:"#345678",secondaryColor:"#f5f5f5" };

test("all five isolated template presets exist and have distinct brand palettes", () => {
  assert.deepEqual(Object.keys(VENUE_PRESETS), [
    "pickleball-reserve","the-pickle-cave","the-mad-pickle",
    "trnd-pickleball","angeles-pickleball-center",
  ]);
  assert.equal(new Set(Object.values(VENUE_PRESETS).map(p=>p.primary)).size, 5);
  assert.deepEqual(VENUE_PRESETS["pickleball-reserve"].primary, "#80011f");
  assert.deepEqual(VENUE_PRESETS["angeles-pickleball-center"].primary, "#0b2f73");
  assert.equal(VENUE_PRESETS["the-pickle-cave"].primary, "#242620");
  assert.equal(VENUE_PRESETS["the-mad-pickle"].primary, "#176a45");
  assert.equal(VENUE_PRESETS["trnd-pickleball"].primary, "#244f66");
  for (const [id, preset] of Object.entries(VENUE_PRESETS)) {
    assert.equal(resolveVenueTemplate("reserve", id), id);
    const out = applyVenuePreset(base, id);
    assert.equal(out.venueName, preset.name);
    assert.equal(out.primaryColor, preset.primary);
    assert.equal(out.venueSlug, base.venueSlug);
    assert.equal(out.timezone, base.timezone);
  }
});
test("legacy Reserve default and API mode remain backward-compatible", () => {
  assert.equal(resolveVenueTemplate(), "pickleball-reserve");
  assert.equal(resolveVenueTemplate("api", "unknown-value"), "api");
  assert.deepEqual(applyVenuePreset(base, "api"), base);
  assert.throws(()=>resolveVenueTemplate("reserve", "../bad"), /Unknown VENUE_TEMPLATE/);
});
test("venue image paths cannot leak another brand or include traversal", () => {
  assert.equal(imageBelongsToVenue("/venues/the-pickle-cave/courts/court-1.jpg",
    "the-pickle-cave"), true);
  assert.equal(imageBelongsToVenue("/venues/pickleball-reserve/logos/logo.jpg",
    "the-pickle-cave"), false);
  assert.equal(imageBelongsToVenue("/venues/the-pickle-cave/../evil.png",
    "the-pickle-cave"), false);
});
test("Reserve style remains unchanged; other themes use scoped variables", () => {
  const reserve = venueThemeStyle(base,"pickleball-reserve");
  assert.equal(reserve["--venue-page"], undefined);
  const cave = venueThemeStyle(base,"the-pickle-cave",
    "/venues/the-pickle-cave/hero/hero.jpg");
  assert.equal(cave["--venue-page"], VENUE_PRESETS["the-pickle-cave"].page);
  assert.equal(cave["--venue-hero-image"], 'url("/venues/the-pickle-cave/hero/hero.jpg")');
  assert.equal(resolvePresentationBrand(base,{ template: "trnd-pickleball" }).venueName,
    "TRND Pickleball");
});
