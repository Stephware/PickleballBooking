# Progress and verification

Last updated: 2026-11-03

## User-reported local setup
- [x] PostgreSQL 17 Docker instance and DBeaver connection working on developer's Mac.
- [x] Nine-table SQL schema was previously initialized; **no database or Docker change in Phase 3**.

## Phase 1 — merged
- [x] ASP.NET Core .NET 10 and Next.js starter, tests, context wiki.
- [ ] Runtime .NET/npm build verification still not demonstrated in this conversation.
- [ ] Next.js package-lock.json must be generated and committed after local install.

## Phase 2 — PR #2 (not yet merged as of Phase 3 start)
- [x] SQL-first EF Core mapping, context, repositories/unit-of-work and /health/db source.
- [x] Static SQL/EF mapping audit passed; original DB schema and Compose unchanged.
- [ ] Build, /health/db connectivity and isolated PostgreSQL integration verification remain pending.
- [ ] Initial EF migration baseline/snapshot intentionally deferred: see docs/database-migrations.md.

## Phase 3 — stacked PR, API source implemented
- [x] Cookie authentication backed by existing staff_users and salted Identity password hasher.
- [x] One-time console-only OWNER account bootstrap from user-secrets.
- [x] Role-based API authorization (OWNER, MANAGER, STAFF) with database-backed active/role check on each authenticated request.
- [x] Admin CSRF token validation, HttpOnly cookie, HTTPS-only production mode, explicit credentialed CORS, and IP-partitioned login rate limiting.
- [x] Self-service current-password change; reset invalidates existing cookies via password fingerprint.
- [x] Owner-only staff creation, activation/deactivation and staff password reset.
- [x] Public venue details, opening hours and active court list.
- [x] Protected venue branding and booking settings, 7-day operating hours, court creation/update/soft-deactivation; no deletion.
- [x] Court deactivation blocked while future bookings are still active.
- [x] Integration and DTO validation test source; auth/setup/runbook documentation.
- [x] No schema changes, no new tables, no migrations, no Docker/DB actions.

## Phase 3 verification remaining
- [ ] Run dotnet restore/build/test on Mac (not available to authoring environment).
- [ ] Configure connection string and bootstrap owner using local user-secrets, then remove bootstrap password.
- [ ] Verify login CSRF, logout, roles, all CRUD endpoints and cookie rotation against a disposable / local development database.
- [ ] Check production reverse proxy HTTPS/cookie/Data Protection key persistence before actual deployment.

## Future work
- [ ] Phase 4: availability and pricing rules.
- [ ] Phase 5: booking engine and safe concurrency.
- [ ] Phase 6: payments and walk-in operations.
- [ ] Phases 7–8: branded player and admin frontend.
- [ ] Phase 9: comprehensive E2E/security/deployment checks.

**Source implemented ≠ runtime verified.** Keep Phase 3 reviewable as a stacked PR until Phase 2 is merged.
