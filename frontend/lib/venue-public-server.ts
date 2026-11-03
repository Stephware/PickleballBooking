import "server-only";
import { parseVenuePublicDetails, defaultReservePhotos } from "@/lib/venue-public";

/** Read only public, developer-approved values. No player/admin API secret here. */
export function getVenuePublicDetails() {
  const configPhotos = process.env.VENUE_GALLERY_JSON?.trim();
  const result = parseVenuePublicDetails({
    VENUE_PHONE: process.env.VENUE_PHONE,
    VENUE_FACEBOOK_URL: process.env.VENUE_FACEBOOK_URL,
    VENUE_GALLERY_JSON: process.env.VENUE_GALLERY_JSON,
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
