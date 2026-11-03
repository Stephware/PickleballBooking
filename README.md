# PickleballBooking

Reusable, independently branded pickleball court booking systems: **one deployment and PostgreSQL database per venue**, shared source code, configurable courts/hours/rates/branding. Not a marketplace.

## Implementation progress

- **Phase 1 (merged):** .NET 10 API and Next.js 16/TypeScript/Tailwind starter, tests, tracked wiki/AGENTS.md.
- **Phase 2 (on main):** SQL-first EF Core/Npgsql mapping to the nine-table PostgreSQL database, repositories and DB health.
- **Phase 3 (merged into Phase 2 feature branch):** Staff cookie/CSRF authentication, roles, venue settings/hours and court management.
- **Phase 4 (merged into Phase 3 feature branch):** Public availability/price quote APIs and admin pricing rules.
- **Phase 5 (merged into parent feature branch):** Guest booking holds, idempotent retries, HMAC guest access, expiry worker.
- **Phase 6 (PR #6, stacked on Phase 5):** GCash/bank proof submissions, manual payment review, private staff-only proof preview, walk-in/phone/Messenger bookings and maintenance blocks.
- **Phase 7 (merged to parent Phase 6 feature branch):** Responsive branded Next.js player site, court grid, booking/payment proof/status and secure guest gateway.
- **Phase 8 (stacked on Phase 7):** Separate /admin staff dashboard, protected .NET cookie/CSRF gateway, bookings, payment proof reviews/ledger, walk-ins, blocks, courts, pricing, hours, venue and staff accounts.

**Not yet implemented:** automated bank/GCash settlement or refunds, approved recipient configuration, normalized booking_source column, secure cross-device guest recovery, and production deployment hardening. Phases 3–8 must still be integrated into main after local tests. All source builds and DB flows still require local verification.

## Local API

Connect to the *existing* local PostgreSQL 17 instance on port 5435. Configure connection credentials via local user-secrets, never Git:

```bash
dotnet user-secrets set "ConnectionStrings:Pickleball" "Host=localhost;Port=5435;Database=pickleball_db;Username=pickleball_app;Password=YOUR_PASSWORD" --project backend/Pickleball.Api
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

The example command can expose the password in shell history; use an interactive secret input in real development. **Phase 5 needs a persistent Booking:SigningKey**; Phase 6 additionally needs a durable, private absolute **ProofStorage:Directory**. Configure both outside Git as described in the phase guides. Open `http://localhost:5090/health/db` before API queries.

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

## Player frontend — Phase 7

```bash
cd frontend
cp .env.example .env.local
npm install
npm run check
npm run build
npm run dev
```

Open http://localhost:3000 for venue branding, date/court grid and booking, and **http://localhost:3000/admin** for the Owner/Manager/Staff dashboard. The private /booking/{code} page supports proof upload/status. APP_ORIGIN must match the frontend public origin (required in production) and API_BASE_URL is server-only. Commit frontend/package-lock.json after the first actual local npm install. See [Phase 7 guide](docs/phase-7-player-frontend.md).

## Docs and safety

- [AGENTS.md](AGENTS.md) — coding-agent rules
- [docs/context/index.md](docs/context/index.md) — Karpathy-style selective wiki
- [docs/context/ui-ux.md](docs/context/ui-ux.md) — UI UX Pro Max for design; Impeccable for audit/polish
- [docs/phase-4-availability-pricing.md](docs/phase-4-availability-pricing.md) — rules and endpoints
- [docs/phase-5-booking-engine.md](docs/phase-5-booking-engine.md) — bookings, holds, signed guest access and expiry
- [docs/phase-6-payments-operations.md](docs/phase-6-payments-operations.md) — manual payments, proof storage, staff bookings and court blocks
- [docs/phase-7-player-frontend.md](docs/phase-7-player-frontend.md) — player pages, server-only gateway, secure booking access and UI verification
- [docs/phase-8-owner-staff-dashboard.md](docs/phase-8-owner-staff-dashboard.md) — staff sign-in, role-aware dashboard, payment proof and operations
- [docs/phase-3-authentication.md](docs/phase-3-authentication.md) — staff auth and one-time owner bootstrap
- [docs/database-migrations.md](docs/database-migrations.md) — SQL-first EF migration safeguards
- [docs/development.md](docs/development.md) — local setup

No database migration or Docker reset is performed. The project has not yet been built/tested on a local .NET runtime through this GitHub-only implementation.
