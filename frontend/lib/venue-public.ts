/** Public, developer-supplied presentation data for one independent venue.
 * This module is pure so validators can be unit tested without server secrets. */
export type VenuePhoto = { src: string; alt: string };
export type VenueContact = { phoneLabel: string | null; phoneHref: string | null; facebookUrl: string | null };
export type VenuePaymentDetails = {
  gcash: { accountName: string; accountNumber: string; qrPath: string | null } | null;
  bank: { bankName: string; accountName: string; accountNumber: string; qrPath: string | null } | null;
};
export type VenuePublicDetails = {
  photos: VenuePhoto[];
  contact: VenueContact;
  payments: VenuePaymentDetails;
};

const imagePattern = /^\/(?:venue\/(?:[A-Za-z0-9_-]+\/)*|venues\/[a-z0-9-]+\/(?:logos|hero|courts)\/)[A-Za-z0-9_-]+\.(?:avif|webp|png|jpe?g)$/i;
/** Only local, developer-deployed raster assets. No remote redirects, SVG, traversal or data URLs. */
export function safeVenueImage(value: unknown): string | null {
  return typeof value === "string" && value.length <= 200 && imagePattern.test(value)
    ? value : null;
}
function plain(value: unknown, length = 100): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length > 0 && result.length <= length &&
    !/[<>]/.test(result) && !Array.from(result).some(c => c.charCodeAt(0) < 32) ? result : null;
}
export function parseVenuePhotos(raw: string | undefined): VenuePhoto[] {
  if (!raw || raw.length > 4000) return [];
  try {
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const photos: VenuePhoto[] = [];
    const seen = new Set<string>();
    for (const value of list) {
      if (photos.length === 6) break;
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const item = value as Record<string, unknown>;
      const src = safeVenueImage(item.src);
      const alt = plain(item.alt, 140);
      if (src && alt && !seen.has(src)) {
        photos.push({ src, alt }); seen.add(src);
      }
    }
    return photos;
  } catch { return []; }
}
export function parseVenuePhone(raw: string | undefined): VenueContact {
  const value = plain(raw, 28);
  const digits = value?.replace(/[^0-9]/g, "") ?? "";
  const valid = value && /^\+?[0-9() -]+$/.test(value) &&
    digits.length >= 7 && digits.length <= 15;
  return { phoneLabel: valid ? value : null,
    phoneHref: valid ? "tel:" + (value.startsWith("+") ? "+" : "") + digits : null,
    facebookUrl: null };
}
export function safeFacebookUrl(raw: string | undefined): string | null {
  if (!raw || raw.length > 250) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    if (!["facebook.com", "www.facebook.com", "m.facebook.com", "m.me"].includes(url.hostname.toLowerCase()))
      return null;
    if (url.pathname === "/" || url.pathname.includes("..")) return null;
    // Strip fragments and nonessential tracking parameters. Preserve profile.php?id= if needed.
    const id = url.pathname === "/profile.php" ? url.searchParams.get("id") : null;
    if (url.pathname === "/profile.php" && (!id || !/^\d{1,24}$/.test(id))) return null;
    url.search = id ? "?id=" + id : "";
    url.hash = "";
    return url.toString();
  } catch { return null; }
}
function accountNumber(raw: string | undefined): string | null {
  const value = plain(raw, 40);
  return value && /^[+0-9 ()-]{6,40}$/.test(value) &&
    value.replace(/[^0-9]/g, "").length >= 6 ? value : null;
}
export function parseVenuePublicDetails(config: Record<string, string | undefined>): VenuePublicDetails {
  const contact = parseVenuePhone(config.VENUE_PHONE);
  contact.facebookUrl = safeFacebookUrl(config.VENUE_FACEBOOK_URL);
  // Safety gate: instructions appear only after a deployer explicitly approves real details.
  const approved = config.VENUE_PAYMENT_INSTRUCTIONS_APPROVED === "true";
  const gcashName = plain(config.VENUE_GCASH_NAME);
  const gcashNumber = accountNumber(config.VENUE_GCASH_NUMBER);
  const bankName = plain(config.VENUE_BANK_NAME);
  const bankAccount = plain(config.VENUE_BANK_ACCOUNT_NAME);
  const bankNumber = accountNumber(config.VENUE_BANK_ACCOUNT_NUMBER);
  return {
    photos: parseVenuePhotos(config.VENUE_GALLERY_JSON),
    contact,
    payments: {
      gcash: approved && gcashName && gcashNumber
        ? { accountName: gcashName, accountNumber: gcashNumber,
            qrPath: safeVenueImage(config.VENUE_GCASH_QR_PATH) } : null,
      bank: approved && bankName && bankAccount && bankNumber
        ? { bankName, accountName: bankAccount, accountNumber: bankNumber,
            qrPath: safeVenueImage(config.VENUE_BANK_QR_PATH) } : null,
    },
  };
}

/** Photos uploaded by this venue and imported from its original feature branch.
 * Descriptions are deliberately neutral: never infer facilities from a filename. */
export const defaultReservePhotos: VenuePhoto[] = [
  { src: "/venue/court-1.jpg", alt: "Pickleball venue — court photograph one" },
  { src: "/venue/court-2.jpg", alt: "Pickleball venue — court photograph two" },
  { src: "/venue/court-3.jpg", alt: "Pickleball venue — court photograph three" },
  { src: "/venue/court-4.jpg", alt: "Pickleball venue — court photograph four" },
];
