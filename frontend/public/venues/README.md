# Venue-owned marketing assets

Each venue has its **own** folder. Add images through GitHub's
**Add file → Upload files** in the correct folder (or commit via Git).

```text
frontend/public/venues/
  pickleball-reserve/
    logos/      logo.jpg
    hero/       hero.jpg
    courts/     court-1.jpg … court-4.jpg
  the-pickle-cave/
    logos/      logo.png
    hero/       hero.jpg
    courts/     court-1.jpg, court-2.jpg, …
  the-mad-pickle/
    logos/      logo.png
    hero/       hero.jpg
    courts/     court-1.jpg, court-2.jpg, …
  trnd-pickleball/
    logos/      logo.png
    hero/       hero.jpg
    courts/     court-1.jpg, court-2.jpg, …
  angeles-pickleball-center/
    logos/      logo.png
    hero/       hero.jpg
    courts/     court-1.jpg, court-2.jpg, …
```

## Automatic media discovery

For the four **new venue presets**, a deployed frontend automatically loads:
- `logos/logo.webp`, `logo.jpg`, `logo.jpeg`, `logo.png` or `logo.avif` (first found)
- `hero/hero.webp`, `hero.jpg`, `hero.jpeg`, `hero.png` or `hero.avif`
- `courts/court-1.jpg` through `court-99.avif` (first **six** sorted numerically)

Accepted formats: JPG/JPEG, PNG, WebP and AVIF. Filenames must match
the conventions. Rebuild/redeploy after adding assets: repository uploads do
**not** instantly appear in an already running production container.

There is intentionally **no admin photo uploader** yet. These are
developer-managed, public, marketing-only assets. Don't store payment
receipts, customer details, admin documents, API keys, unpublished contracts,
or anything private under `public`. Before publishing, confirm image
ownership and permission, strip EXIF/geolocation metadata, and optimize
landscape court photos (roughly 1200–1600px). Use genuine venue photos;
do not present invented illustrations as real facilities.

**Reserve compatibility:** Existing
`/venue/brand-logo.jpg` and `/venue/court-1.jpg` through
`court-4.jpg` remain unchanged and are still the live defaults. Identical
source images are also filed in Reserve's dedicated library for future work.
To replace the live Reserve gallery intentionally, configure
`VENUE_GALLERY_JSON` with approved filenames and their descriptive ALT
text. The existing hero still references its original court-2 photo.

**Angeles logo caution:** The supplied `2026 Season 2 Angeles Pickleball Cup`
graphic is a **tournament/event logo**, not necessarily the permanent
Angeles Pickleball Center venue logo. Only put an explicitly approved
center logo at `angeles-pickleball-center/logos/logo.png`. The photo of
the exterior venue signage is a good candidate for `hero/hero.jpg`
once confirmed for public website use. No unverified images are populated
in the other four prospect folders.

## Selecting an independent frontend presentation

Set `VENUE_TEMPLATE` on the **frontend only**, then restart/redeploy:

- `pickleball-reserve` (default) — burgundy / cream, unchanged.
- `the-pickle-cave` — deep forest green / warm linen / subtle gold.
- `the-mad-pickle` — aubergine / blush / peach.
- `trnd-pickleball` — midnight blue / cool slate / mint.
- `angeles-pickleball-center` — navy / warm white / burnt orange.

The **same Reserve-style layout and existing booking/payment features** are
reused. Your chosen preset only changes appearance and public venue name;
it does **not** create a new venue database, authentication realm, or
tenant ID. Connecting several prospects to a single backend will expose
the **same** synthetic courts, bookings and schedules. Do this only for
private demonstrations with artificial data.

For a real customer, provision a separate deployment, database, private
proof storage, secrets and owner credentials, and confirm each venue's
legal branding and payment instructions before public launch.
Run `VENUE_BRAND_MODE=api` to preserve a separately configured API
identity rather than applying one of these preset names.
