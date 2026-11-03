import "server-only";
import { parseVenuePublicDetails, defaultReservePhotos } from "@/lib/venue-public";

/** Read only public, developer-approved values. No player/admin API secret here. */
export function getVenuePublicDetails() {
  const configPhotos = process.env.VENUE_GALLERY_JSON?.trim();
  const result = parseVenuePublicDetails({
    VENUE_PHONE: process.env.VENUE_PHONE,
    VENUE_FACEBOOK_URL: process.env.VENUE_FACEBOOK_URL,
    // Bundled real photos are enabled for the Pickleball Reserve release by default.
    // VENUE_GALLERY_JSON=[] explicitly opts out for deployments without approval.
    VENUE_GALLERY_JSON: process.env.VENUE_GALLERY_JSON ?? JSON.stringify([
      { src: "/venue/court-2.jpg", alt: "Pickleball Reserve indoor courts and red playing surface" },
      { src: "/venue/court-1.jpg", alt: "Central walkway and surrounding indoor pickleball courts" },
      { src: "/venue/court-3.jpg", alt: "Indoor pickleball venue court view" },
      { src: "/venue/court-4.jpg", alt: "Another view of the Pickleball Reserve playing courts" },
    ]),
    VENUE_PAYMENT_INSTRUCTIONS_APPROVED: process.env.VENUE_PAYMENT_INSTRUCTIONS_APPROVED,
    VENUE_GCASH_NAME: process.env.VENUE_GCASH_NAME,
    VENUE_GCASH_NUMBER: process.env.VENUE_GCASH_NUMBER,
    VENUE_GCASH_QR_PATH: process.env.VENUE_GCASH_QR_PATH,
    VENUE_BANK_NAME: process.env.VENUE_BANK_NAME,
    VENUE_BANK_ACCOUNT_NAME: process.env.VENUE_BANK_ACCOUNT_NAME,
    VENUE_BANK_ACCOUNT_NUMBER: process.env.VENUE_BANK_ACCOUNT_NUMBER,
    VENUE_BANK_QR_PATH: process.env.VENUE_BANK_QR_PATH,
  });
  // The photos uploaded for this venue are the developer's default presentation.
  // Explicit alternate galleries win. Future venues must supply their own photos
  // or opt out using VENUE_HIDE_IMPORTED_PHOTOS=true.
  if (!result.photos.length && (!configPhotos || configPhotos === "[]") &&
      process.env.VENUE_HIDE_IMPORTED_PHOTOS !== "true") {
    return { ...result, photos: defaultReservePhotos };
  }
  return result;
}
