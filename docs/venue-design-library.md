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
| `the-pickle-cave` | The Pickle Cave | `#242620` | Olive green `#445c23` | `#faf8f3` | Charcoal, stone, muted lime |
| `the-mad-pickle` | The Mad Pickle | `#176a45` | Emerald green | `#faf6ed` | Warm paper, mustard |
| `trnd-pickleball` | TRND Pickleball | `#244f66` | Steel blue | `#f6f9fb` | White, pale cool blue |
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

## Run all five frontend previews (macOS, one codebase)

The latest code adds a launcher that automatically applies **both** the correct
front-end port and a different Next dev cache directory. Using only
`npm run dev -- --port` five times in the same source directory would share
`.next` cache/locks and is **not** reliable. First start an isolated demo
PostgreSQL database and the existing ASP.NET Core API at
`http://localhost:5090` (or set `API_BASE_URL`). Never reuse a real
client's payment records for demos.

From the **repository root** in five different Terminal tabs:

```bash
bash scripts/dev-venue.sh reserve  # http://localhost:3000
bash scripts/dev-venue.sh cave     # http://localhost:3001
bash scripts/dev-venue.sh mad      # http://localhost:3002
bash scripts/dev-venue.sh trnd     # http://localhost:3003
bash scripts/dev-venue.sh angeles  # http://localhost:3004
```

Each launcher selects `VENUE_BRAND_MODE=reserve`, the appropriate
`VENUE_TEMPLATE`, `APP_ORIGIN`, and a separate `NEXT_DIST_DIR`. There is
no need to create five .env files or five frontend repos. Optionally set
`API_BASE_URL` before running a command if your API uses a different port.
Run `npm ci` once in `frontend/` after checkout. Stop each frontend with
Ctrl+C. Other brand themes and asset folders remain unchanged when you select
another one. For a real paying venue, **pin its deployment to a released Git
commit** and create its own backend/database/proofs/secret keys. The shared
frontend codebase itself is not a guarantee of immutable client versions.
