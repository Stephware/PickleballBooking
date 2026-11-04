import type { Venue } from "@/types/player";

/** Developer-owned visual presets: not venue ownership or API tenancy. */
export const VENUE_PRESETS = {
  "pickleball-reserve": {
    name: "Pickleball Reserve",
    primary: "#80011f", secondary: "#f7e9d7",
    page: "#fcf8f3", ink: "#291a21", muted: "#64515a",
    border: "#e8d8d4", tint: "#fff1ed", action: "#80011f",
    deep: "#5b071c", mid: "#820b27", light: "#a92d41",
    accent: "#ffe5d9", sidebar: "#68051e",
  },
  "the-pickle-cave": {
    name: "The Pickle Cave",
    // Supplied black cave logo + charcoal/stone courts, with restrained olive accents.
    primary: "#242620", secondary: "#f5f2ed",
    page: "#faf8f3", ink: "#201f1d", muted: "#655f57",
    border: "#dfdad0", tint: "#eeeae0", action: "#445c23",
    deep: "#121411", mid: "#242722", light: "#515144",
    accent: "#e4e7ad", sidebar: "#191b18",
  },
  "the-mad-pickle": {
    name: "The Mad Pickle",
    // Supplied forest-green pickle mascot on warm paper, mustard details.
    primary: "#176a45", secondary: "#fbf4e6",
    page: "#faf6ed", ink: "#24352b", muted: "#63695f",
    border: "#e3decf", tint: "#eff3e5", action: "#176a45",
    deep: "#0f4f34", mid: "#176a45", light: "#33845e",
    accent: "#f4d68c", sidebar: "#125238",
  },
  "trnd-pickleball": {
    name: "TRND Pickleball",
    // Supplied dark steel-blue logo with white paddle and wordmark.
    primary: "#244f66", secondary: "#f4f8fb",
    page: "#f6f9fb", ink: "#1c3140", muted: "#5b7180",
    border: "#d7e1e8", tint: "#eaf1f6", action: "#244f66",
    deep: "#17384b", mid: "#244f66", light: "#3a6780",
    accent: "#dfeaf1", sidebar: "#1b4155",
  },
  "angeles-pickleball-center": {
    name: "Angeles Pickleball Center",
    primary: "#0b2f73", secondary: "#fff8f1",
    page: "#fbfaf7", ink: "#152a47", muted: "#536274",
    border: "#dee4ed", tint: "#f3f5fb", action: "#a94310",
    deep: "#09244d", mid: "#124277", light: "#245d87",
    accent: "#ffdcba", sidebar: "#0b2f73",
  },
} as const;

export type VenueTemplateId = keyof typeof VENUE_PRESETS;
export type VenueTemplate = VenueTemplateId | "api";
export const DEFAULT_VENUE_TEMPLATE: VenueTemplateId = "pickleball-reserve";

/** Invalid IDs fail closed instead of silently displaying another venue's brand. */
export function resolveVenueTemplate(mode?: string, template?: string): VenueTemplate {
  if (mode === "api") return "api"; // legacy independent API-provided branding
  if (!template || template === "reserve") return DEFAULT_VENUE_TEMPLATE;
  if (Object.prototype.hasOwnProperty.call(VENUE_PRESETS, template))
    return template as VenueTemplateId;
  throw new Error("Unknown VENUE_TEMPLATE. Choose a documented venue slug.");
}

/** Display identity only; court, pricing, scheduling and auth are backend-owned. */
export function applyVenuePreset(venue: Venue, template: VenueTemplate): Venue {
  if (template === "api") return venue;
  const preset = VENUE_PRESETS[template];
  return { ...venue, venueName: preset.name,
    primaryColor: preset.primary, secondaryColor: preset.secondary };
}

/** URLs are not supplied by guests; they must refer to this venue's asset folder. */
export function imageBelongsToVenue(src: string, template: VenueTemplateId): boolean {
  return src.startsWith(`/venues/${template}/`) &&
    /^\/venues\/[a-z0-9-]+\/(?:logos|hero|courts)\/[A-Za-z0-9_-]+\.(?:png|jpe?g|webp|avif)$/i.test(src);
}
