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
- Price rules: court-specific > venue-wide, priority DESC, ID DESC, prorate at rule boundaries, round final total to 2 decimals. Never accept client-computed totals for booking/payment; Phase 5 must revalidate pricing and GiST conflict under transaction.

## Current implementation

Phase 1 merged. Phase 2 EF Core SQL-first mapping is still PR #2 at the start of Phase 3. Phase 3 adds API-source implementations for staff cookie authentication/CSRF, roles, CLI-only owner bootstrap, staff management, venue settings and court management. Phase 4 adds server-side availability, timezone-aware slots, pricing/quote calculators, and pricing rule APIs. Booking creation/holds, payment processing and Next.js admin/player screens are NOT implemented. Availability/quotes are read-only and never reserve a slot. Phase 3 is a stacked branch based on Phase 2 and is NOT runtime-verified against local PostgreSQL. See [docs/context/progress.md](docs/context/progress.md) and verify before claiming otherwise.

## Documentation hygiene

Prefer concise topic pages linking to canonical SQL/code. Update decisions.md when decisions change; do not confuse a plan with working code.
