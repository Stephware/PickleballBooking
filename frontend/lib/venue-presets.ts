import type { Venue } from "@/types/player";

/** Developer-owned visual presets: not venue ownership or API tenancy. */
export const VENUE_PRESETS = {
  "pickleball-reserve": {
    name: "Pickleball Reserve",
    primary: "#80011f", secondary: "#fff9ed",
    page: "#fcf8f3", ink: "#291a21", muted: "#64515a",
    border: "#e8d8d4", tint: "#fff1ed", action: "#80011f",
    deep: "#5b071c", mid: "#820b27", light: "#a92d41",
    accent: "#ffe5d9", sidebar: "#68051e",
  },
  "the-pickle-cave": {
    name: "The Pickle Cave",
    primary: "#1a4b3c", secondary: "#f6f2e9",
    page: "#f7f6f1", ink: "#182922", muted: "#536459",
    border: "#d8e1d7", tint: "#ecf3ed", action: "#1a4b3c",
    deep: "#102b25", mid: "#235447", light: "#387265",
    accent: "#f3d6a2", sidebar: "#153b33",
  },
  "the-mad-pickle": {
    name: "The Mad Pickle",
    primary: "#633359", secondary: "#fff6f3",
    page: "#fcf8f6", ink: "#30212d", muted: "#6b5865",
    border: "#eadce4", tint: "#f8edf2", action: "#633359",
    deep: "#382037", mid: "#623453", light: "#8a5570",
    accent: "#ffe0c7", sidebar: "#43233f",
  },
  "trnd-pickleball": {
    name: "TRND Pickleball",
    primary: "#18466d", secondary: "#f2f9fa",
    page: "#f6f9fb", ink: "#192e41", muted: "#566978",
    border: "#d8e4ea", tint: "#eaf2f6", action: "#18466d",
    deep: "#0c2843", mid: "#174b67", light: "#2a6b81",
    accent: "#d5f4ee", sidebar: "#133654",
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
