# Progress and verification

Last updated: 2026-11-03

## User-reported setup

- [x] PostgreSQL 17 Docker and DBeaver working on Mac (user-reported).
- [x] Nine-table schema initialized previously; **no database changes performed** during Phases 1 or 2.

## Phase 1 — merged

- [x] .NET 10 API, Next.js/TypeScript/Tailwind starter, API/test structure and context wiki.
- [ ] Local build and runtime verification not established in this conversation.
- [ ] Commit `frontend/package-lock.json` after initial `npm install` on the developer's Mac.

## Phase 2 — EF Core integration (PR in progress)

- [x] Npgsql EF Core 10 provider and EF Core design-time tooling references.
- [x] All nine SQL-first entities and explicit EF Core table/column/relationship configurations.
- [x] `PickleballDbContext`, design-time factory, safe user-secrets connection configuration.
- [x] Venue, court, schedule and booking repositories with scoped DI; unit-of-work for coordinated save/transactions.
- [x] `/health/db` reports DB reachability, all nine tables, and venue settings row.
- [x] `/health` retained as a process-only check even when DB is down.
- [x] Model-metadata unit tests, opt-in read-only live DB tests, and opt-in rollback CRUD test for isolated test DB.
- [x] Read-only SQL verification script for the 9 tables, exclusion constraint, triggers and expiration function.
- [x] Documented schema-first migration/baseline safeguards.
- [x] SQL schema and Compose file unchanged; no automatic migrations, no destructive commands.

## Not yet runtime-verified

- [ ] `dotnet restore/build/test` in a .NET-enabled environment.
- [ ] Configure `ConnectionStrings:Pickleball` with local user-secrets and verify `GET /health/db` returns 200.
- [ ] Run `database/sql/05_verify_existing_schema.sql` against working DB in DBeaver or psql.
- [ ] Opt-in integration tests against an isolated PostgreSQL test database.
- [ ] EF Core migration baseline + model snapshot: **deliberately deferred until generated and reviewed on a working .NET environment**; do not run `dotnet ef database update` yet.

## Future phases

- [ ] Phase 3: staff authentication/roles, venue and court management.
- [ ] Phase 4: actual availability and pricing engine.
- [ ] Phase 5: atomic booking workflow, holds and expiration worker.
- [ ] Phase 6: payments and manual booking operations.
- [ ] Phase 7–8: player and owner frontend.
- [ ] Phase 9: E2E/security tests and multi-venue deployment.

**Status:** Phase 2 source implementation ready for GitHub review; DB connectivity and test execution remain pending local verification.
