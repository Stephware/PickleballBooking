# PickleballBooking

Reusable, independently branded pickleball court booking systems: **one deployment and PostgreSQL database per venue**, shared source code, configurable courts/hours/rates/branding. Not a marketplace.

## Implementation and verification

Phases 1–8 provide the .NET/SQL-first API, transactional holds, manual payment review and staff operations, player website and owner dashboard. Phase 9 integrates their stacked branch history, fixes payment/security/build/UI defects and supplies reproducible tests and independent-venue deployment artifacts.

See [Phase 9 verification](docs/phase-9-final-verification.md) for actual test counts and coverage, [development](docs/development.md) to run the system, and [deployment](docs/deployment.md) for containers, trusted HTTPS ingress, private storage, backups and rollback. The canonical nine-table schema is unchanged and existing local database data is untouched.

Main integration requires review/approval. Public launch still needs official venue payment instructions, malware controls, real TLS ingress and operator backup/monitoring acceptance. Automated settlement/refund transfers, verified cross-device guest recovery and normalized booking-source reporting remain deferred.

## Admin usability improvements (post-Phase-9 Phase 1)

The current improvement branch simplifies the owner dashboard to **Today / Schedule / Payments / Manage / My Account**, combines Add Booking and Block Court around one visual slot picker, and improves mobile operations. A controlled current-slot WALK_IN exception is available to authenticated staff and is rechecked before reservation. Team Accounts and Venue Settings are hidden from everyday navigation; underlying multi-staff support remains, and venue branding edits are developer-configuration-gated. Main is unaffected until this PR is reviewed and merged.

See [Phase 1 admin usability guide](docs/improvements-phase-1-admin-usability.md). Runtime build/tests and real-browser usability checks for the new branch are still pending; historical Phase 9 verification counts are not proof for these changes.

## Public website / payment UX improvements (post-Phase-9 Phase 2)

The customer website now supports a **developer-managed court-photo carousel (max 6 real venue photos), click-to-call/Facebook contacts, and verified GCash/bank payment instructions with optional QR**. These fields use validated, per-deployment Next.js server environment configuration, not owner-facing design controls. Missing/unapproved details never display guessed contacts or account numbers. Guest/staff receipt images now support full-size previews, with authenticated staff images and protected PDF downloads.

To configure: see [Phase 2 operator guide](docs/improvements-phase-2-public-payment.md) and [frontend/.env.example](frontend/.env.example). Actual court photography, contact details and payment recipients were **not provided**, so the gallery uses the existing illustration and payment instructions stay unpublished until official values and approval are supplied. This is not a payment gateway.

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
npm ci
npm run check
npm run build
npm run dev
```

Open http://localhost:3000 for venue branding, date/court grid and booking, and **http://localhost:3000/admin** for the Owner/Manager/Staff dashboard. The private /booking/{code} page supports proof upload/status. APP_ORIGIN must match the frontend public origin (required in production) and API_BASE_URL is server-only. Commit frontend/package-lock.json after the first actual local npm ci. See [Phase 7 guide](docs/phase-7-player-frontend.md).

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
- [docs/phase-9-final-verification.md](docs/phase-9-final-verification.md) — executed tests and launch gates
- [docs/deployment.md](docs/deployment.md) — independent venue runtime and recovery
- [docs/development.md](docs/development.md) — local setup

No database migration or existing database reset was performed. Phase 9 executed local .NET, PostgreSQL, frontend/browser and disposable production-container verification.
