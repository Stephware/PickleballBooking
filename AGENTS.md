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
- Backend: ASP.NET Core (.NET 10); planned frontend: Next.js and TypeScript; database: PostgreSQL 17 on Docker.
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
- Phase 5 has no payment collection or booking frontend; Phase 6–8 supply those capabilities.

## Current implementation

Phases 1–2 are on main; Phase 3 and 4 PRs were merged into their parent **feature branches**, not directly into main. Phase 5 is developed on the Phase 4 branch, and runtime build/PostgreSQL validation is still pending. See [docs/context/progress.md](docs/context/progress.md) before claiming a feature is verified. The API now has booking/hold source code, but not payments, public booking screens or admin booking UI.

## Documentation hygiene

Prefer concise topic pages linking to canonical SQL/code. Update decisions.md when decisions change; do not confuse a plan with working code.
