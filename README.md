# PickleballBooking

Reusable, independently branded pickleball court booking systems: **one deployment and PostgreSQL database per venue**, shared source code, configurable courts/hours/rates/branding. Not a marketplace.

## Implementation progress

- **Phase 1 (merged):** .NET 10 API and Next.js 16/TypeScript/Tailwind starter, tests, tracked wiki/AGENTS.md.
- **Phase 2 (PR #2):** SQL-first EF Core/Npgsql mapping to the nine-table PostgreSQL database, repositories and DB health.
- **Phase 3 (PR #3, stacked):** Staff cookie/CSRF authentication, Owner/Manager/Staff roles, venue settings/hours, court management.
- **Phase 4 (stacked on Phase 3):** Public availability and server-side pricing/quote APIs, owner/manager pricing rule management, timezones/status precedence and calculation tests.

**Not yet implemented:** booking creation or cancellation, hold expiration worker, payments, working player/admin frontend, deployment automation.

## Local API

Connect to the *existing* local PostgreSQL 17 instance on port 5435. Configure connection credentials via local user-secrets, never Git:

```bash
dotnet user-secrets set "ConnectionStrings:Pickleball" "Host=localhost;Port=5435;Database=pickleball_db;Username=pickleball_app;Password=YOUR_PASSWORD" --project backend/Pickleball.Api
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

The example command can expose the password in shell history; use an interactive secret input in real development. Open `http://localhost:5090/health/db` before API queries.

```text
GET /api/v1/availability?date=2026-11-03
GET /api/v1/availability?date=2026-11-03&courtId=1
GET /api/v1/pricing/quote?date=2026-11-03&courtId=1&startsAt=09:00
```

Dates in the sample are illustrative; use a current date within the configured booking window. These routes return **estimated prices and current statuses**, not reservations.

## Frontend (development placeholder)

```bash
cd frontend
npm install
npm run check
npm run dev
```

Open http://localhost:3000. Commit the generated `frontend/package-lock.json` after the first local install.

## Docs and safety

- [AGENTS.md](AGENTS.md) — coding-agent rules
- [docs/context/index.md](docs/context/index.md) — Karpathy-style selective wiki
- [docs/context/ui-ux.md](docs/context/ui-ux.md) — UI UX Pro Max for design; Impeccable for audit/polish
- [docs/phase-4-availability-pricing.md](docs/phase-4-availability-pricing.md) — rules and endpoints
- [docs/phase-3-authentication.md](docs/phase-3-authentication.md) — staff auth and one-time owner bootstrap
- [docs/database-migrations.md](docs/database-migrations.md) — SQL-first EF migration safeguards
- [docs/development.md](docs/development.md) — local setup

No database migration or Docker reset is performed. The project has not yet been built/tested on a local .NET runtime through this GitHub-only implementation.
