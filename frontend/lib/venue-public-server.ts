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
  // Use the supplied Reserve photos only when the Reserve theme is active and
  // no custom gallery is configured. An explicit [] disables the photo gallery.
  if (!configPhotos && process.env.VENUE_BRAND_MODE !== "api" &&
      process.env.VENUE_HIDE_IMPORTED_PHOTOS !== "true") {
    return { ...result, photos: defaultReservePhotos };
  }
  return result;
}
