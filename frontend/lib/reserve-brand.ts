import type { CSSProperties } from "react";
import type { Venue } from "@/types/player";
import { brandStyle } from "@/lib/player";

/** This venue's developer-managed pitch identity, not an owner-editable field. */
export const RESERVE_PALETTE = {
  burgundy: "#80011f",
  deepBurgundy: "#630d22",
  cream: "#fff9ed",
  sand: "#f8eee8",
  ink: "#261d20",
} as const;
export const RESERVE_LOGO_PATH = "/venue/brand-logo.jpg";

/** Reuse the existing validated style contract while overriding presentation
 * colors for the venue that supplied this logo and photographic assets. */
export function reserveBrandStyle(
  venue: Pick<Venue, "primaryColor" | "secondaryColor">,
): CSSProperties {
  return brandStyle(venue) as CSSProperties;
}
