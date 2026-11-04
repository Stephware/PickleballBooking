import "server-only";

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { VENUE_PRESETS, type VenueTemplateId } from "@/lib/venue-presets";
import type { VenuePhoto } from "@/lib/venue-public";

export type VenueMedia = {
  logo: string | null;
  hero: string | null;
  photos: VenuePhoto[];
};

/** Files live in developer-owned public assets, never user-uploaded payment storage.
 * Conventional filenames let you add images without editing application code.
 * Only known template IDs are accepted; paths never come from user input. */
export function discoverVenueMedia(template: VenueTemplateId): VenueMedia {
  const root = join(process.cwd(), "public", "venues", template);
  const publicRoot = `/venues/${template}`;
  function first(directory: string, baseName: string): string | null {
    return ["webp", "jpg", "jpeg", "png", "avif"]
      .map(ext => `${baseName}.${ext}`)
      .find(name => existsSync(join(root, directory, name)))
      ?.replace(/^/, `${publicRoot}/${directory}/`) ?? null;
  }
  const courtDir = join(root, "courts");
  let filenames: string[] = [];
  try {
    filenames = readdirSync(courtDir, { withFileTypes: true })
      .filter(entry => entry.isFile() &&
        /^court-[0-9]{1,2}\.(?:png|jpe?g|webp|avif)$/i.test(entry.name))
      .map(entry => entry.name)
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true })).slice(0, 6);
  } catch { /* Missing or empty directories intentionally have no photo gallery. */ }
  return {
    logo: first("logos", "logo"),
    hero: first("hero", "hero"),
    photos: filenames.map((name, i) => ({
      src: `${publicRoot}/courts/${name}`,
      alt: `${VENUE_PRESETS[template].name} court photograph ${i + 1}`,
    })),
  };
}
