# Phase 7 — player booking frontend

This phase replaces the original Next.js placeholder with a player-facing website: branded venue homepage, live court/time grid, contiguous slot selection, contact and booking form, private booking status, receipt upload with local preview, and booking lookup. Phase 8 remains the staff/owner dashboard.

## Implemented pages

| Route | Purpose |
| --- | --- |
| / | Venue branding, court/time matrix, next/previous/date picker, status legend, selected price and booking form |
| /booking/PB-XXXXXXXXXXXXXXXX | Guest booking state, receipt upload, payment history and eligible hold cancellation |
| /find-booking | Booking-reference lookup, optional access-token restoration for a different browser |

The court grid has **courts as columns and times as rows**, reflecting the approved UI direction (not a floor plan). It supports any number of courts via horizontal scrolling with a sticky time column. Buttons show status **as text and color**: AVAILABLE (green), OCCUPIED (red), PENDING (yellow), ELAPSED (gray), BLOCKED/UNAVAILABLE (muted). Only AVAILABLE cells can be clicked; adjacent cells on the same court build a contiguous range of at most eight slots. All prices are estimates from the server. A new reservation triggers the backend's Phase 5 transactional availability and pricing validation.

The player booking form asks for name, phone or email, optional notes and creates a **HELD**, not CONFIRMED, reservation. It preserves the same UUID v4 idempotency key when retrying an unchanged submission. Editing fields or changing selected slots creates a new key. On a 409 conflict, the player can refresh the schedule and choose another interval.

The booking-status screen distinguishes HELD, AWAITING_REVIEW, CONFIRMED, EXPIRED, CANCELLED and COMPLETED. The receipt form accepts PNG/JPEG/WebP/PDF up to 5 MiB, displays a local image preview and file details, and submits exactly the booking total as claimed amount. It requires a transfer reference and sends the file as multipart to Phase 6. The backend checks the real upload and enforces deadlines; the frontend does not assume a payment is approved just because proof is submitted.

**Venue payment instructions:** Phase 6 has no GCash recipient number, bank details, or instructions exposed by the API. The UI therefore deliberately does **not invent or display account details**; it tells users to use official instructions supplied by the venue. Before a public launch, add owner-approved payment instructions through a reviewed configuration/schema change or another legitimate source.

## Secure same-origin API gateway

All player requests go through the server-only Next.js Route Handler:

- GET /api/player/venue and /api/player/availability?date=YYYY-MM-DD
- POST /api/player/bookings
- GET /api/player/bookings/{code}
- POST /api/player/bookings/{code}/cancel
- GET and POST /api/player/bookings/{code}/payments
- POST /api/player/bookings/{code}/access (optional private-token recovery)

The gateway allowlists only these player operations, never proxies admin routes, and forwards to the .NET API via server-only API_BASE_URL. It uses no-store responses, rejects non-matching POST Origin, and avoids backend tokens in analytics, browser storage, or query strings.

When the backend returns a new guest accessToken, the gateway **removes it from the browser response** and sets a per-booking HttpOnly, SameSite=Lax cookie, Secure in production, scoped to /api/player/bookings. Guest lookup, cancellation, and proof submission read this cookie on the server and add X-Booking-Token to the .NET request. This supports secure same-browser use without requiring a guest account. The cookie lasts up to 30 days; it is not a replacement for a full recovery/account system.

**Cross-device limitation:** Since online creation deliberately hides the bearer token in an HttpOnly cookie, the UI cannot export the token for another device. The optional access-token form supports venue-provided tokens (for example, manual bookings), not automatic online booking recovery. Implement a verified recovery channel before promising cross-device self-service access.

## Configuration

From frontend/, use env files excluded by .gitignore. Example:

    API_BASE_URL=http://localhost:5090
    APP_ORIGIN=http://localhost:3000

API_BASE_URL is server-only, not NEXT_PUBLIC_. In production, APP_ORIGIN **must** be the exact HTTPS public frontend origin or modifying gateway routes refuse requests. Serve the frontend and API using a trusted configuration; apply HTTPS, security headers and real anti-abuse protection at the ingress. The .NET backend must already have ConnectionStrings:Pickleball, Booking:SigningKey and ProofStorage:Directory configured privately. Do not commit any password, booking token or real receipt.

Run:

    cd frontend
    npm install
    npm run check
    npm run build
    npm run dev

Then open http://localhost:3000. The backend should be running on localhost:5090. Commit package-lock.json after initial npm install, and use npm ci for subsequent reproducible builds. A GitHub-only authoring session cannot run npm install/build against the repo; do not claim those checks passed.

## Verification checklist

- Site loads each venue's branding from GET /api/v1/venue, with safe fallback and an offline/non-bookable state when API is down
- Check 320/375/768/1024px layouts and large court counts (1, 3, 8, 12+) in real browsers
- Check keyboard-only traversal, visible focus, screen-reader labels/status announcements, text contrast and non-color state meanings
- Pick 1–8 adjacent AVAILABLE slots and confirm the price and booking request match the backend
- Verify double-book race: a 409 must not show a successful reservation
- Confirm retry with unchanged form maintains same idempotency key
- Create a HELD reservation and reopen from the same browser
- Upload 5 MiB or smaller allowed image/PDF, preview image, reject oversize/invalid receipt, and show review status
- Confirm HTTPS SameSite/HttpOnly token cookie, no token in frontend JavaScript, URL, logs, analytics or localStorage
- Verify expired hold, cancelled booking, temporary backend failure, empty/closed court day, and missing access
- Confirm GCash/bank recipient details are NOT invented and real external payment review remains required
- Do not test with personal payment data or production bookings; use a disposable development venue database

## UI UX Pro Max + Impeccable

The site uses a deliberately restrained sport-editorial direction: warm near-white surfaces, strong typography, an abstract CSS pickleball court illustration, high-contrast actions, cards only where needed, a sticky horizontal court grid, and venue-scoped brand tokens in frontend/lib/player.ts and frontend/app/globals.css. Status colors are fixed semantics independent of brand accents.

Follow docs/context/ui-ux.md: UI UX Pro Max for initial layout/system proposals and Impeccable for accessibility/mobile/final polish when installed in the developer's environment. **Those global skills were not directly callable from the GitHub connector**, so their audits and actual viewport screenshots still need to be run locally. Do not claim a rendered UI audit occurred in this environment.

## Deferred

Staff login, protected payment approvals, admin court management and staff booking/maintenance dashboards remain Phase 8. Payment provider integrations, authenticated cross-device booking recovery and production observability/security tests belong to future reviewed work/Phase 9.

## Post-Phase-9 usability Phase 2 extension

The player site now accepts only real, developer-managed `/venue/...` court photos through a scroll-snap gallery with optional phone/Facebook contacts. The booking status/payment page displays validated GCash or bank account information **only** when an operator explicitly approves complete per-venue values. Otherwise, it warns users not to transfer money until they independently confirm official details. Photo, recipient and QR input are public server configuration, not booking or staff-editable database records. Images can be enlarged locally before upload; PDF local preview is via user-selected file blob URL. Staff image enlargement continues to use authenticated proof delivery. See [Phase 2 improvement guide](improvements-phase-2-public-payment.md).
