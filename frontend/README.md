# PickleballBooking — player frontend (Phase 7)

Next.js 16 App Router, TypeScript, Tailwind 4 and scoped CSS design tokens. Player booking website, court/time matrix, booking form, private status, manual payment-proof upload with preview, and lookup. Staff/owner dashboard is Phase 8.

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
