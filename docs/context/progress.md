# Progress and verification

Last updated: 2026-11-03

## Previous phases
- [x] Phase 1 ASP.NET Core/.NET 10 + Next.js scaffold merged.
- [x] Phase 2 EF Core model/repositories and DB health source implemented in PR #2 (open at Phase 4 start).
- [x] Phase 3 staff cookie authentication, venue/courts/hours APIs in PR #3 (open, stacked on Phase 2).
- [ ] Prior phases have not been runtime-built/tested or exercised against the developer's PostgreSQL in this conversation.
- [x] Existing PostgreSQL 17 and DBeaver connection reported working by the user; schema and Docker volumes unaffected.

## Phase 4 — source implementation
- [x] Public `GET /api/v1/availability?date=&courtId=` returns all active courts with generated status/price slots.
- [x] Public `GET /api/v1/pricing/quote?date=&courtId=&startsAt=` uses the same server-side slot quote.
- [x] Dynamic venue-local operating hours/slot duration and UTC instants; closed days/invalid DST boundaries handled conservatively.
- [x] Server-side rule engine: court-specific over venue; priority/ID; weekday/weekend; partial-interval proration, final rounding.
- [x] Batched schedule query with statuses AVAILABLE, OCCUPIED, PENDING, ELAPSED, BLOCKED and UNAVAILABLE. Expired but still active holds remain pending until explicit status transition.
- [x] Owner/Manager pricing rule create/update/deactivate; staff read-only; existing Phase 3 cookie/CSRF applies.
- [x] DTOs, service/repository interfaces and implementations, DI wiring and automated test source.
- [x] Dedicated [Phase 4 rules](../phase-4-availability-pricing.md), API inventory, agent/wiki updates.
- [x] No changes to PostgreSQL SQL bootstrap, Docker or existing data.

## Verification remaining
- [ ] `dotnet restore/build/test` in .NET-enabled runtime.
- [ ] Confirm SQL-first EF mapping and real /health/db against local database.
- [ ] Test availability responses, pricing CRUD/authorization and all seven operating-day setups with seeded **disposable** test data.
- [ ] Confirm real booking status transitions and expiry behavior once Phase 5 exists.
- [ ] Commit frontend/package-lock.json after first local npm install.
- [ ] Rebase/retarget sequential PRs after dependencies merge.

## Next phases
- [ ] Phase 5 atomic booking engine, temporary holds, expiration worker, customer reservation lookup/cancellation and PostgreSQL conflict handling.
- [ ] Phase 6 manual bookings/payments and verification.
- [ ] Phase 7 player Next.js UI; Phase 8 owner dashboard; Phase 9 production and comprehensive verification.

**Do not mark Phase 4 runtime-verified until real build/tests and PostgreSQL integration pass.**
