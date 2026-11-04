import "server-only";
import { parseVenuePublicDetails, defaultReservePhotos } from "@/lib/venue-public";
import { discoverVenueMedia } from "@/lib/venue-media-server";
import { resolveVenueTemplate, imageBelongsToVenue } from "@/lib/venue-presets";

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
  const template = resolveVenueTemplate(process.env.VENUE_BRAND_MODE,
    process.env.VENUE_TEMPLATE);
  if (process.env.VENUE_HIDE_IMPORTED_PHOTOS === "true")
    return { ...result, photos: [] };
  if (template === "api") return result;
  if (template === "pickleball-reserve") {
    // Do not change the existing Reserve photography or its original paths.
    return (!configPhotos || configPhotos === "[]")
      ? { ...result, photos: defaultReservePhotos } : result;
  }
  // A named prospect's gallery can never accidentally use Reserve or another
  // prospect's assets. File discovery only reads its own developer-curated dir.
  if (configPhotos && configPhotos !== "[]")
    return { ...result, photos: result.photos.filter(photo =>
      imageBelongsToVenue(photo.src, template) &&
      photo.src.includes("/courts/")) };
  return { ...result, photos: discoverVenueMedia(template).photos };
}
