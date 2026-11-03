# Public venue images (developer-managed)

Place **real, venue-approved**, optimized JPG, PNG, WebP or AVIF images here.
The player gallery looks for the relative `/venue/...` paths configured
in `VENUE_GALLERY_JSON` (max 6). Do not put customer photos, payment proofs,
staff ID photos, secrets or private documents here.

Recommended: 3–6 landscape images, 1200px–1600px wide, compressed with
descriptive ALT text (court number, indoor/outdoor, surfaces/lighting).
Remove EXIF/location metadata before publishing. Photos are not uploaded from
the owner dashboard; developers curate and deploy them.

If a venue has not provided images, leave `VENUE_GALLERY_JSON=[]` and the
existing court illustration remains. Do not publish placeholders as real photos.

A public payment QR path, when provided, is a separate developer-approved
raster asset in this directory. Verify the QR destination before enabling
`VENUE_PAYMENT_INSTRUCTIONS_APPROVED=true`.
