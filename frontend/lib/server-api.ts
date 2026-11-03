import "server-only";
import { FALLBACK_VENUE, safeBrandColor } from "@/lib/player";
import type { Venue } from "@/types/player";
import { resolvePresentationBrand } from "@/lib/venue-brand";

export function apiOrigin(): string {
  return process.env.API_BASE_URL ?? "http://localhost:5090";
}
export async function getServerVenue(): Promise<{ venue: Venue; connected: boolean }> {
  const decorate = (venue: Venue) => resolvePresentationBrand(venue, {
    mode: process.env.VENUE_BRAND_MODE,
    primary: process.env.VENUE_BRAND_PRIMARY,
    secondary: process.env.VENUE_BRAND_SECONDARY,
    logoPath: process.env.VENUE_LOGO_PATH,
  });
  try {
    const response = await fetch(new URL("/api/v1/venue", apiOrigin()), {
      cache: "no-store", signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error("Venue unavailable");
    const json: unknown = await response.json();
    const v = json as Partial<Venue>;
    if (typeof v?.venueName !== "string" || typeof v?.timezone !== "string" ||
        typeof v?.currency !== "string") throw new Error("Malformed venue");
    return {
      connected: true,
      venue: decorate({
        ...FALLBACK_VENUE, venueName: v.venueName,
        venueSlug: v.venueSlug ?? FALLBACK_VENUE.venueSlug,
        timezone: v.timezone, currency: v.currency,
        logoUrl: typeof v.logoUrl === "string" && /^https:\/\//.test(v.logoUrl)
          ? v.logoUrl : null,
        primaryColor: safeBrandColor(v.primaryColor, FALLBACK_VENUE.primaryColor),
        secondaryColor: safeBrandColor(v.secondaryColor, FALLBACK_VENUE.secondaryColor),
      }),
    };
  } catch { return { venue: decorate(FALLBACK_VENUE), connected: false }; }
}
