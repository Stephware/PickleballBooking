# Reusable player/admin UI — five isolated venue colorways

The **same Pickleball Reserve layout** is reused for all listed venues;
this is not the newly generated concept board, marketplace or a full
multi-tenant rearchitecture. The public website, mobile court/time card
picker, staff UI, booking/payment/availability logic are identical.
Only developer-owned brand colors, names, approved media and environment
configuration differ.

| Theme ID (`VENUE_TEMPLATE`) | Venue display name | Primary | Action | Background | Secondary accents |
|---|---|---|---|---|---|
| `pickleball-reserve` | Pickleball Reserve | `#80011f` | Burgundy | `#fcf8f3` | Cream, blush |
| `the-pickle-cave` | The Pickle Cave | `#1a4b3c` | Forest green | `#f7f6f1` | Linen, muted gold |
| `the-mad-pickle` | The Mad Pickle | `#633359` | Plum | `#fcf8f6` | Blush, peach |
| `trnd-pickleball` | TRND Pickleball | `#18466d` | Deep blue | `#f6f9fb` | Ice, soft mint |
| `angeles-pickleball-center` | Angeles Pickleball Center | `#0b2f73` | Burnt orange `#a94310` | `#fbfaf7` | Navy, cream, warm orange |

Colors are **proposal presets** for venues not yet onboarded, not claimed
as official logos or identity guides. Verify colors, names, photos and legal
permission with each owner before presenting them as final production branding.
These palettes retain accessible high-contrast dark body text and labels
and readable white-on-dark CTA buttons. Booking statuses retain semantic
colors independent of visual branding.

## How to preview a chosen look

In `frontend/.env.local` for a local preview (a disposable demo backend):

```dotenv
VENUE_BRAND_MODE=reserve
VENUE_TEMPLATE=angeles-pickleball-center
VENUE_BRAND_PRIMARY="#80011f"
VENUE_BRAND_SECONDARY="#fff9ed"
```

The old Reserve override variables above are intentionally ignored for
the four non-Reserve presets, preventing stale .env values from turning
other venues burgundy. You only need to change `VENUE_TEMPLATE`.
Restart the frontend after changes. The existing server-owned `API_BASE_URL`
and browser `APP_ORIGIN` protections still apply.

Approved logos and photos use the dedicated [asset directories](../frontend/public/venues/README.md).
Conventional filename upload is discovered automatically for non-Reserve
presets (after rebuilding/redeploying). If a prospect has no approved logo
or photos, show name initials and a clean photo-pending state, **never**
another client's image or a fabricated photo. The original Reserve images,
hero and visual styling remain unchanged.

**Important:** Changing the displayed name and palette does not change the
underlying backend `venueSlug`, court data, guests, payment proofs,
owner credentials or application authentication. A private demo can use one
synthetic API for design comparisons, but **never publicly present a shared
customer backend as if clients were isolated**. Real buyers need
independent venue deployments, database/volumes, secrets, verified payment
recipients and access controls.

A later true shared-database multi-tenant SaaS design would require
tenant-scoped ownership and isolation across all nine tables, routes,
security tokens, proof storage, constraints, jobs and operations, with
dedicated security review and migration. This work does **not** implement it.
