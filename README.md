# PickleballBooking

Reusable, independently branded pickleball court booking systems: **one deployment and PostgreSQL database per venue**, shared source code, configurable courts/hours/rates/branding. Not a marketplace.

## Implementation progress

- **Phase 1 (merged):** .NET 10 API and Next.js 16/TypeScript/Tailwind starter, tests, tracked wiki/AGENTS.md.
- **Phase 2 (on main):** SQL-first EF Core/Npgsql mapping to the nine-table PostgreSQL database, repositories and DB health.
- **Phase 3 (merged into Phase 2 feature branch):** Staff cookie/CSRF authentication, roles, venue settings/hours and court management.
- **Phase 4 (merged into Phase 3 feature branch):** Public availability/price quote APIs and admin pricing rules.
- **Phase 5 (stacked on Phase 4):** Actual guest booking holds, idempotent retries, HMAC guest access, staff confirmation/cancellation, expiry worker and tests.

**Not yet implemented:** payments/proof/approval, walk-in source tagging, working player/admin frontend and production deployment automation. Phases 3–5 must still be integrated into main. All source builds and DB flows still require local verification.

## Local API

Connect to the *existing* local PostgreSQL 17 instance on port 5435. Configure connection credentials via local user-secrets, never Git:

```bash
dotnet user-secrets set "ConnectionStrings:Pickleball" "Host=localhost;Port=5435;Database=pickleball_db;Username=pickleball_app;Password=YOUR_PASSWORD" --project backend/Pickleball.Api
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

The example command can expose the password in shell history; use an interactive secret input in real development. **Phase 5 also needs a persistent Booking:SigningKey secret**, configured as explained in [docs/phase-5-booking-engine.md](docs/phase-5-booking-engine.md). Open `http://localhost:5090/health/db` before API queries.

```text
GET /api/v1/availability?date=2026-11-03
GET /api/v1/availability?date=2026-11-03&courtId=1
GET /api/v1/pricing/quote?date=2026-11-03&courtId=1&startsAt=09:00
```

Dates in the sample are illustrative; use a current date within the configured booking window. Availability/quote endpoints return **estimated prices**, not reservations.

Phase 5 guest booking routes:
```text
POST /api/v1/bookings
GET /api/v1/bookings/{bookingCode}              # X-Booking-Token required
POST /api/v1/bookings/{bookingCode}/cancel     # X-Booking-Token required
GET /api/v1/admin/bookings?date=YYYY-MM-DD
POST /api/v1/admin/bookings/{bookingCode}/confirm  # OWNER/MANAGER + CSRF
POST /api/v1/admin/bookings/{bookingCode}/cancel   # OWNER/MANAGER + CSRF
```
See [Phase 5 API, token and idempotency details](docs/phase-5-booking-engine.md). Booking creation places a time-limited **HELD** entry; it is not payment confirmation.

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
- [docs/phase-5-booking-engine.md](docs/phase-5-booking-engine.md) — bookings, holds, signed guest access and expiry
- [docs/phase-3-authentication.md](docs/phase-3-authentication.md) — staff auth and one-time owner bootstrap
- [docs/database-migrations.md](docs/database-migrations.md) — SQL-first EF migration safeguards
- [docs/development.md](docs/development.md) — local setup

No database migration or Docker reset is performed. The project has not yet been built/tested on a local .NET runtime through this GitHub-only implementation.
