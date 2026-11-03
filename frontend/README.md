# PickleballBooking — player and admin frontend (Phases 7–8)

Next.js 16 App Router, TypeScript, Tailwind 4 and scoped CSS design tokens. Player booking website, court/time matrix, booking form, private status, manual payment-proof upload with preview, and lookup. Phase 8 adds a protected Owner/Manager/Staff dashboard at /admin.

## Run locally

Start the ASP.NET Core backend and existing PostgreSQL first (see ../docs/development.md). The API needs its connection, Booking:SigningKey, and private ProofStorage:Directory secrets for the full flow.

    cd frontend
    cp .env.example .env.local
    npm install
    npm run check
    npm run build
    npm run dev

Open http://localhost:3000. For production, APP_ORIGIN must match the public HTTPS origin; API_BASE_URL is server-side and must not be exposed to browser JavaScript. Never commit .env.local, booking tokens, receipt files or sensitive data.

**Package lock:** after first npm install, commit frontend/package-lock.json, then use npm ci for later installs.

## Structure

- app/page.tsx — branded player homepage and availability
- app/booking/[code]/page.tsx — private reservation and payment status (not indexed)
- app/find-booking/page.tsx — booking reference/access input
- app/api/player/[...segments]/route.ts — restricted server-only gateway to existing backend; HttpOnly token cookie
- components/booking — court/time grid, reservation form, payment-proof form and booking status
- components/ui/VenueHeader.tsx — venue identity and player navigation
- lib/player.ts — status labels, date/price formatting, selection rules, brand/contrast tokens
- lib/server-api.ts — server-side venue retrieval with offline fallback
- tests/player.test.mjs — Node 22 pure-helper tests; included in npm run check

## Security and current limitations

Backend bearer tokens never enter localStorage or booking URLs; creation stores them in an HttpOnly cookie through the Next.js gateway. Same-browser status access works, but cross-device recovery is not implemented for online bookings; the optional private token entry supports tokens provided by the venue. Never treat a submitted receipt as verified payment. No GCash/bank receiver details are configured in the current API, so do not fabricate them in the UI.

If the backend is down, the page shows offline and no booking buttons. The frontend currently requires local real-browser accessibility and mobile verification. See ../docs/phase-7-player-frontend.md and ../docs/context/ui-ux.md.


## Phase 8 — staff administration

Open **http://localhost:3000/admin** and log in with a Phase 3 staff account. First Owner account is still created only by the .NET bootstrap CLI. APP_ORIGIN must exactly match the public browser origin in production for every modifying admin request.

Admin features: today's snapshot, reservations, payment proof queue with private preview, approved/external cash records and refund references, staff-created bookings, maintenance blocks, court and pricing management, opening hours, owner-only venue settings and team accounts, and account password changes.

Secure BFF architecture:
- app/api/admin/session/route.ts — login/logout/profile with backend authenticated cookie/antiforgery handshake
- app/api/admin/[...segments]/route.ts — allowlisted staff operations, backend CSRF and private receipt response
- lib/admin-proxy.ts and lib/admin-policy.ts — server-only cookie/CSRF forwarding, Origin validation, per-method allowlist
- components/admin/ and app/admin/admin.css — role-aware frontend and scoped responsive design
- tests/admin-policy.test.mjs — allowed/denied administrative paths for all supported methods

Backend staff tickets and CSRF tokens reside only in HttpOnly, SameSite=Strict cookies set by the Next.js server, never frontend JS/storage. The backend still enforces all roles. Private receipt images/PDFs are not public files. See ../docs/phase-8-owner-staff-dashboard.md for full requirements, setup and pending verification.

Before release run npm run check/build, check 320–1024px responsive/keyboard/reader behavior, actual HTTPS/CSRF/auth session and role restrictions, and disposable PostgreSQL E2E. UI UX Pro Max/Impeccable global skills have not yet been run through the GitHub connector.
