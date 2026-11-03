import assert from "node:assert/strict";
import test from "node:test";
import {
  parseVenuePhotos, parseVenuePhone, safeFacebookUrl, safeVenueImage,
  parseVenuePublicDetails,
} from "../lib/venue-public.ts";

test("photo gallery permits only local raster images with meaningful descriptions", () => {
  const list = JSON.stringify([
    { src: "/venue/court-1.webp", alt: "Pickleball court one in daylight" },
    { src: "/venue/court-2.jpg", alt: "Covered court two with viewing area" },
    { src: "/venue/court-1.webp", alt: "Duplicate" },
    { src: "https://other.example/court.jpg", alt: "Remote photo" },
    { src: "/venue/../secret.png", alt: "Traversal" },
    { src: "/venue/evil.svg", alt: "SVG" },
    { src: "/venue/court-3.png", alt: "" },
  ]);
  assert.deepEqual(parseVenuePhotos(list), [
    { src: "/venue/court-1.webp", alt: "Pickleball court one in daylight" },
    { src: "/venue/court-2.jpg", alt: "Covered court two with viewing area" },
  ]);
  assert.equal(safeVenueImage("data:image/png;base64,test"), null);
  assert.equal(safeVenueImage("//another.site/venue/court.png"), null);
  assert.equal(safeVenueImage("/venue/court_3.avif"), "/venue/court_3.avif");
  assert.deepEqual(parseVenuePhotos("not json"), []);
});
test("gallery never exceeds six even when configured with many", () => {
  assert.equal(parseVenuePhotos(JSON.stringify(Array.from({ length: 12 }, (_, i) => ({
    src: "/venue/court-" + i + ".jpg", alt: "Court picture " + i,
  })))).length, 6);
});
test("phone links are dialable and Facebook destinations are allowlisted", () => {
  assert.deepEqual(parseVenuePhone("+63 917 123 4567"), {
    phoneLabel: "+63 917 123 4567", phoneHref: "tel:+639171234567", facebookUrl: null,
  });
  assert.equal(parseVenuePhone("javascript:alert(1)").phoneHref, null);
  assert.equal(safeFacebookUrl("https://www.facebook.com/testvenue?fbclid=tracking"),
    "https://www.facebook.com/testvenue");
  assert.equal(safeFacebookUrl("https://m.me/example"), "https://m.me/example");
  assert.equal(safeFacebookUrl("https://facebook.com.evil.example/testvenue"), null);
  assert.equal(safeFacebookUrl("http://www.facebook.com/testvenue"), null);
  assert.equal(safeFacebookUrl("https://facebook.com/"), null);
});
test("payment recipient details are hidden until explicitly operator-approved", () => {
  const config = {
    VENUE_GCASH_NAME: "Official Test Account",
    VENUE_GCASH_NUMBER: "+63 917 123 4567",
    VENUE_BANK_NAME: "Test Bank",
    VENUE_BANK_ACCOUNT_NAME: "Official Venue Account",
    VENUE_BANK_ACCOUNT_NUMBER: "000-111-222",
    VENUE_GCASH_QR_PATH: "/venue/gcash-qr.png",
    VENUE_BANK_QR_PATH: "https://untrusted.example/qr.png",
  };
  assert.deepEqual(parseVenuePublicDetails(config).payments, { gcash: null, bank: null });
  const details = parseVenuePublicDetails({
    ...config, VENUE_PAYMENT_INSTRUCTIONS_APPROVED: "true",
  });
  assert.deepEqual(details.payments.gcash, {
    accountName: "Official Test Account", accountNumber: "+63 917 123 4567",
    qrPath: "/venue/gcash-qr.png",
  });
  assert.deepEqual(details.payments.bank, {
    bankName: "Test Bank", accountName: "Official Venue Account",
    accountNumber: "000-111-222", qrPath: null,
  });
  assert.equal(parseVenuePublicDetails({
    VENUE_PAYMENT_INSTRUCTIONS_APPROVED: "true",
    VENUE_GCASH_NAME: "Recipient",
  }).payments.gcash, null);
});
