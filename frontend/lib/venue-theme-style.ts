import type { CSSProperties } from "react";
import type { Venue } from "@/types/player";
import { brandStyle } from "./player.ts";
import { VENUE_PRESETS, type VenueTemplate } from "./venue-presets.ts";

/** The existing Reserve preset uses original CSS untouched. Other venues
 * reuse the same DOM/layout with CSS variables scoped to their deployment. */
export function venueThemeStyle(
  venue: Pick<Venue, "primaryColor" | "secondaryColor">,
  template: VenueTemplate,
  hero: string | null = null,
): CSSProperties {
  const base = brandStyle(venue);
  if (template === "pickleball-reserve") return base;
  const p = template === "api" ? {
    page: "#f7f9f7", ink: "#203028", muted: "#536459",
    border: "#dce5dd", tint: "#eff5ef", action: venue.primaryColor,
    deep: "#203a30", mid: "#294f42", light: "#45715e",
    accent: "#e7f5e8", sidebar: "#203a30",
  } : VENUE_PRESETS[template];
  return {
    ...base,
    "--venue-page": p.page,
    "--venue-ink": p.ink,
    "--venue-muted": p.muted,
    "--venue-border": p.border,
    "--venue-tint": p.tint,
    "--venue-action": p.action,
    "--venue-deep": p.deep,
    "--venue-mid": p.mid,
    "--venue-light": p.light,
    "--venue-accent": p.accent,
    "--venue-sidebar": p.sidebar,
    "--venue-hero-image": hero ? `url("${hero}")` : "none",
  } as CSSProperties;
}
