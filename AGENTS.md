# Agent instructions — PickleballBooking

## Every task

1. Read [docs/context/index.md](docs/context/index.md) first. Open only the topic pages relevant to your current task to conserve tokens.
2. Inspect real code and SQL; documentation and plans are NOT proof that a feature is implemented.
3. Explicitly distinguish approved product decisions, proposed features, implemented functionality, and tested functionality.
4. Keep changes scoped. Preserve one reusable codebase with a separately branded deployment/database per venue. Do not introduce a marketplace without user approval.
5. For any frontend/UI task, read [docs/context/ui-ux.md](docs/context/ui-ux.md). When available in the active environment, use **UI UX Pro Max** for design systems, layouts, typography, and visual direction, then **Impeccable** for usability, accessibility, responsiveness, audits, refinement, and polish. Prefer the existing design system; avoid conflicting redesigns.
6. After substantive changes, update the relevant docs/context topic page, append a brief log entry, and update docs/context/progress.md.
7. Commit AGENTS.md and every docs/context/*.md page to Git. NEVER exclude them via .gitignore.

## Architecture and safety

- Keep the requested repository layout: backend/Pickleball.Api, frontend, database, docs, and PickleballBooking.slnx.
- Backend: ASP.NET Core (.NET 10); frontend: Next.js 16 and TypeScript (player UI Phase 7, admin UI Phase 8); database: PostgreSQL 17 on Docker.
- The user's PostgreSQL instance is ALREADY working. Never run docker compose down -v, reset its volumes, rerun schema initialization SQL on real data, call EnsureCreated/EnsureDeleted/Migrate at startup, or overwrite local .env credentials. Read docs/database-migrations.md before ANY EF migration changes.
- Each venue has its own database and deployment; court count, rates, hours, policy and branding are configuration, not new tables per client.
- EF Core mapping must preserve the SQL-first nine-table schema, UTC timestamptz, TimeOnly for hours, SQL indexes/triggers and PostgreSQL exclusion constraint. Coordinate changes using repositories + IUnitOfWork. Enforce booking transaction safety and PostgreSQL overlap exclusions. Expired HELD/AWAITING_REVIEW rows must transition to EXPIRED before time becomes free.
- Do not commit secrets, customer information, raw passwords, real payment credentials, or sensitive database exports. Use ASP.NET Core user secrets/environment variables and secure password hashing.
- Compute booking validity and pricing on the server and respect venue timezone (default Asia/Manila).
- Admin endpoints use HttpOnly signed cookie authentication, CSRF header for all unsafe /api/v1/admin methods, OWNER/MANAGER/STAFF policies, login throttling and repeated DB active/role checks. Do not replace with unauthenticated writes or localStorage session tokens.
- The first OWNER is created only through the one-time --bootstrap-owner CLI command and local user-secrets; never expose public owner sign-up or commit bootstrap passwords. Password reset must invalidate previous cookies.
- Do not implement court physical deletion: only soft-deactivate, and reject deactivation while future reservations exist.
- Before modifying slot/price behavior, read docs/phase-4-availability-pricing.md. Status order: started/elapsed, block, occupied, pending, unavailable by notice, available. NEVER treat stale HELD/AWAITING_REVIEW rows as available until the persisted status has transitioned to EXPIRED.
- Price rules: court-specific > venue-wide, priority DESC, ID DESC, prorate at rule boundaries, round final total to 2 decimals. Never accept client-computed totals for booking/payment; Phase 5 revalidates pricing in an EF transaction and relies on PostgreSQL GiST exclusion for the final conflict guard.

## Phase 5 booking rules

- Read [docs/phase-5-booking-engine.md](docs/phase-5-booking-engine.md) before modifying booking, idempotency, guest authentication, status transitions or expiry.
- `Booking:SigningKey` is a stable per-venue 32+-byte secret in user-secrets/env, never in Git; changing it breaks prior guest token access and idempotent retries. Keep HMAC domain-separation for booking-code derivation and access-token signing.
- Create requires a new UUID v4 per intended guest reservation; retries **must** reuse the same UUID and identical input. Only return a guest access token to the creator/replay holder; never include it in logs, URL query strings, analytics, or public availability.
- Guest booking access/cancellation requires `X-Booking-Token`; a booking code by itself grants no access. Guest cancels only unstarted HELD/AWAITING_REVIEW; OWNER/MANAGER can confirm an unexpired HELD or cancel an eligible booking.
- Expire stale pending rows explicitly via the SQL `expire_pending_schedule_entries()` function **within booking mutations** and periodically through the background worker. A timestamp alone doesn't change exclusion constraint state.
- Revalidate multiple consecutive slots, venue notice/horizon and pricing in the transaction; persist the entire range as one schedule entry plus one booking. Handle SQLSTATE 23P01/23505 with conflict responses. Future APIs must not overwrite the current database schema without reviewed migrations.
- Phase 5/6 now contain booking, proof, manual payment verification, staff booking and block API source. There is no automatic payment gateway; Phases 7–8 provide the frontend. Consult docs/phase-6-payments-operations.md for financial rules.

## Phase 6 payment and operational safeguards

- Read [docs/phase-6-payments-operations.md](docs/phase-6-payments-operations.md) before changes to receipts, payments, refunds, source metadata, staff booking or maintenance blocks.
- The API **does not process or confirm real transfers**. Guest amounts and proof are unverified claims until OWNER/MANAGER reviews against real external GCash/bank records. Never treat SUBMITTED as paid or call a recorded refund an actual money transfer.
- Maintain transactional relationship of schedule and payment states, serialize on the booking's schedule row, and keep Phase 5 guest cancellation from bypassing SUBMITTED/VERIFIED financial records.
- Payment proofs belong in configured persistent private storage (outside wwwroot), never Git or public static files. Validate file headers and size, use unpredictable filenames, staff-only preview. PDFs are attachments, not inline content. Production requires malware scanning and storage backup.
- Manual staff bookings and blocks must obey Phase 4 availability and PostgreSQL overlap exclusion. Staff-created bookings are CONFIRMED and may be unpaid; source prefix in bookings.notes is **not** a first-class booking_source column. Do not misrepresent it as a durable normalized data model.
- Staff can record payment claims; OWNER/MANAGER approves/rejects and records external refund references. Verify authorization and CSRF before enabling payment actions in Phase 8 frontend.

## Current implementation

Phases 1–8 source is integrated on `feature/phase-9-final-integration`, based on Phase 8 merge `3b0a67e`. Main contains Phases 1–2 until the integration PR is approved and merged. Backend/player/admin workflows have executed against disposable PostgreSQL and real browser/API checks; see [Phase 9 verification](docs/phase-9-final-verification.md) for precise coverage and remaining launch gates. Do not equate passing local tests with production acceptance.

## Documentation hygiene

Prefer concise topic pages linking to canonical SQL/code. Update decisions.md when decisions change; do not confuse a plan with working code.

## Phase 7 player frontend safeguards

- Before editing frontend, read docs/context/ui-ux.md and docs/phase-7-player-frontend.md; reuse frontend/app/globals.css and frontend/lib/player.ts design tokens.
- The frontend is **one branded player site per venue**, not a marketplace. Fetch venue name, logo, brand, timezone/currency and courts from the API; no hardcoded count, schedule, prices or GCash recipient details.
- Build court-by-time UI with semantic status text plus color, keyboard focus, mobile horizontal scrolling, proper empty/error/loading/closed states, and 1–8 contiguous AVAILABLE slots.
- Price on the client is a non-authoritative quote. Backend Phase 5 must always validate the final hold, so show conflicts and expired holds accurately. A submitted receipt is never paid until Phase 6 review/verification.
- Keep API_BASE_URL and the booking bearer access token **server-only**. On booking creation, Next.js Route Handler removes accessToken from JSON and stores it in an HttpOnly, SameSite=Lax cookie (Secure in production). No localStorage, analytics, query parameters, or public client code may read the secret.
- Restrict the Next.js player gateway to explicit backend public routes; verify Origin for POST, set APP_ORIGIN to the public HTTPS origin in production, disable caching of booking/payment responses, and never proxy staff admin endpoints through player routes.
- Online guest cross-device recovery remains unimplemented due to non-exportable HttpOnly tokens; the optional recovery input is only for venue-supplied tokens. Do not imply booking reference alone grants access.
- UI UX Pro Max and Impeccable were used locally in Phase 9. Continue rendered browser/accessibility verification for UI changes; never mark an audit passed without evidence. Run npm run check and npm run build locally.
- AGENTS.md and docs/context/*.md MUST remain committed, never excluded by .gitignore.


## Phase 8 admin frontend security and UX

- Before editing admin routes, read docs/phase-8-owner-staff-dashboard.md, docs/context/ui-ux.md and the original backend Controllers/Admin and Security middleware. The API remains the authoritative role/CSRF boundary; never trust hidden UI buttons as access control.
- Staff sign-in must use .NET anonymous antiforgery cookie+token → login (signed backend cookie) → **new authenticated antiforgery token**. Next.js backend staff/CSRF cookies live in HttpOnly, SameSite=Strict, production Secure cookies scoped to /api/admin; never expose those cookies or tokens to browser JS, localStorage, URLs, analytics or logs.
- All admin mutations require Origin equality to APP_ORIGIN in production and backend X-CSRF-TOKEN + staff/antiforgery cookies. Do not expand the proxy into a generic URL tunnel. New admin actions must be explicitly added to frontend/lib/admin-policy.ts and its tests.
- Keep payment proof previews private under authenticated admin BFF with no-store/nosniff and safe MIME; do not copy PDFs/images into public/static URLs. Refund buttons **record external refunds**, never disburse money.
- Preserve role semantics: STAFF can view reservations and proof and create manual bookings/payment claims; MANAGER/OWNER manage court, pricing, hours, blocks and payment reviews; OWNER alone manages branding/venue policy and staff accounts.
- Use the established Phase 7 theme tokens and scoped frontend/app/admin/admin.css. All status indicators need readable text, confirm dangerous financial/cancel actions, make forms keyboard/mobile accessible, and leave blank amount inputs blank rather than prefilled 0.00.
- Phase 8 admin UI has passed the documented Phase 9 local checks; public production acceptance remains separate. The UI UX Pro Max and Impeccable skills are installed globally on developer machine but have not been executed from GitHub connector.
- Backend SQL-first nine tables and existing Docker data must remain untouched; do not auto-apply EF migrations or reset database volumes.

## Phase 9 verification and deployment safeguards

- Run root `dotnet restore/build/test`; global.json selects Microsoft.Testing.Platform. Live tests require PICKLEBALL_TEST_CONNECTION_STRING plus PICKLEBALL_TEST_MUTATIONS_ENABLED=1 and a database name ending `_test`. Disabled DB tests must report skipped, never false passes.
- Frontend package-lock.json is real and tracked; use npm ci, npm run check and npm run build (supported Webpack build). Browser harness at frontend/tests/e2e/browser-smoke.mjs requires loopback and an explicitly labelled disposable venue before mutations.
- Production requires explicit AllowedHosts, DB configuration, stable Booking signing key, and separate absolute persistent ProofStorage and DataProtection directories. Never recreate a real database to satisfy startup checks.
- Read docs/deployment.md before proxy changes. Trust only the configured BFF peer; derive upstream scheme from APP_ORIGIN. Enable TRUST_PROXY_HEADERS only behind an ingress that replaces X-Forwarded-For and blocks direct public frontend/API access. Validate one client IP; never forward arbitrary chains.
- Refunded transfer references remain consumed; refund metadata appends history without replacing the original verification actor/time/reference.
- Private proof signature/size checks are not malware scanning. Official payment instructions, malware controls, real TLS ingress, backup/restore and monitoring acceptance remain public-launch gates.
- Do not deploy production or merge main without explicit authorization. Preserve all context pages and this file in Git.

## Usability improvements — Phase 1 (post Phase 9)

- Read [docs/improvements-phase-1-admin-usability.md](docs/improvements-phase-1-admin-usability.md) before editing admin navigation, manual booking, blocks or staff availability.
- Default operator experience is **one OWNER per venue**. Show only Today, Schedule, Payments, Manage and My Account in the normal admin UI. Preserve the existing staff/auth APIs/roles for future expanded venues, but do not reintroduce Team Accounts or Venue Settings menus without approval.
- Venue branding and global booking policy are developer-managed by default: `PUT /api/v1/admin/venue` requires OWNER **and** the trusted server config `Developer:AllowVenueEdits=true`. This toggle must default OFF; courts, rates and hours remain manageable.
- Shared admin schedule picker: `components/admin/AdminSlotPicker.tsx`. Always derive courts, dates, statuses and prices from the backend; never make frontend status authoritative. Up to 8 complete consecutive slots on one court. Block creation and PHONE/MESSENGER must use future AVAILABLE slots only.
- Immediate WALK_IN is the only exception: a current ELAPSED slot can be marked `WALK_IN_NOW` through authenticated staff `operations/availability` within min(half slot, 30 minutes) **if no active persisted schedule entry overlaps**. Creation rechecks in a transaction, with PostgreSQL GiST constraint as the final conflict safeguard. Never expose this status in public availability.
- Keep top-positioned back controls for detail steps; ensure 320px+ usability and safe keyboard/mobile interaction. Existing private staff cookie/CSRF/rate limit and payment proof protections must be preserved.
- The improvements are *source implementation* until a fresh `dotnet build/test`, `npm run check/build`, live disposable DB and browser tests pass. Previous Phase 9 passed counts are historical and do not certify this branch.
