import type { Venue } from "@/types/player";

/**
 * Pickleball Reserve is the bundled example venue for this deployment.
 * Other venue deployments can supply their own public color/logo settings.
 * "api" in VENUE_BRAND_MODE respects the backend-configured venue branding.
 */
export const RESERVE_PRIMARY = "#80011f";
export const RESERVE_SECONDARY = "#f7e9d7";
export const RESERVE_LOGO = "/venue/brand-logo.jpg";

export type PublicBrandConfig = {
  mode?: string;
  primary?: string;
  secondary?: string;
  logoPath?: string;
};

const hex = /^#[0-9a-fA-F]{6}$/;
const localLogo = /^\/venue\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:png|jpe?g|webp|avif)$/i;

export function resolvePresentationBrand(venue: Venue, config: PublicBrandConfig): Venue {
  if (config.mode === "api") return venue;
  const primaryColor = config.primary && hex.test(config.primary)
    ? config.primary : RESERVE_PRIMARY;
  const secondaryColor = config.secondary && hex.test(config.secondary)
    ? config.secondary : RESERVE_SECONDARY;
  const logoUrl = config.logoPath === "api"
    ? venue.logoUrl
    : config.logoPath && localLogo.test(config.logoPath)
      ? config.logoPath : RESERVE_LOGO;
  return { ...venue, primaryColor, secondaryColor, logoUrl };
}
