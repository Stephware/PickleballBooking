# Progress and verification

Last updated: 2026-11-02

## User-reported setup

- [x] PostgreSQL 17 Docker database running on Mac; DBeaver authentication/connection resolved (user reported).
- [x] Previous nine-table schema and seed/smoke-test SQL supplied.

## Repository scaffold

- [x] Backend, frontend, database and docs folders; root .NET solution.
- [x] Minimal .NET 10 API /health endpoint.
- [x] Original PostgreSQL Compose and SQL starter preserved as repository reference.
- [x] Git-tracked AGENTS.md and selective docs/context wiki.
- [x] UI/UX development guide for globally installed UI UX Pro Max and Impeccable; linked from wiki and agent instructions.
- [x] .gitignore prevents credentials and build outputs being committed but tracks agent docs.

## NOT implemented or verified yet

- [ ] Running dotnet restore/build or /health from user's machine.
- [ ] EF Core mappings to the existing database, migrations baseline, and live DB connection.
- [ ] Auth and roles, courts/availability/booking endpoints and tests.
- [ ] Hold expiry background worker and secure payment processing/review.
- [ ] Next.js frontend, responsive availability calendar and owner dashboard.
- [ ] Venue-specific production deployment, backups, monitoring.

**Next:** run scaffold locally, then map EF Core to the live schema without recreating the database.
