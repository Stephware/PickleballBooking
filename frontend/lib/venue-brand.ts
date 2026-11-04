import type { Venue } from "@/types/player";
import { applyVenuePreset, imageBelongsToVenue, resolveVenueTemplate,
  VENUE_PRESETS } from "./venue-presets.ts";

/**
 * Pickleball Reserve is the bundled example venue for this deployment.
 * Other venue deployments can supply their own public color/logo settings.
 * "api" in VENUE_BRAND_MODE respects the backend-configured venue branding.
 */
export const RESERVE_VENUE_NAME = "Pickleball Reserve";
export const RESERVE_PRIMARY = "#80011f";
export const RESERVE_SECONDARY = "#f7e9d7";
export const RESERVE_LOGO = "/venue/brand-logo.jpg";

export type PublicBrandConfig = {
  mode?: string;
  template?: string;
  primary?: string;
  secondary?: string;
  logoPath?: string;
};

const hex = /^#[0-9a-fA-F]{6}$/;
const localLogo = /^\/venue\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:png|jpe?g|webp|avif)$/i;

export function resolvePresentationBrand(venue: Venue, config: PublicBrandConfig): Venue {
  const template = resolveVenueTemplate(config.mode, config.template);
  if (template === "api") return venue;
  const preset = VENUE_PRESETS[template];
  // Legacy overrides are supported only for Reserve; other presets must
  // never inherit a stale Reserve .env color when switching templates.
  const primaryColor = template === "pickleball-reserve" &&
    config.primary && hex.test(config.primary) ? config.primary : preset.primary;
  const secondaryColor = template === "pickleball-reserve" &&
    config.secondary && hex.test(config.secondary) ? config.secondary : preset.secondary;
  // A missing logo for a new prospect must show initials, never another venue.
  // Reserve's original public paths remain fully backward-compatible.
  const logoUrl = template === "pickleball-reserve"
    ? config.logoPath === "api" ? venue.logoUrl
      : config.logoPath && localLogo.test(config.logoPath)
        ? config.logoPath : RESERVE_LOGO
    : config.logoPath && imageBelongsToVenue(config.logoPath, template) &&
      config.logoPath.includes("/logos/") ? config.logoPath : null;
  return { ...applyVenuePreset(venue, template),
    primaryColor, secondaryColor, logoUrl };
}
