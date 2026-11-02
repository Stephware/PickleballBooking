# Architecture and data model

## Deployment model

One source codebase; **independent deployment and PostgreSQL database per venue**. Single-venue SQL schema: venue_settings.id=1, nine existing tables. Frontend is a Next.js/TypeScript/Tailwind placeholder; booking and admin screens remain future work.

## API architecture

- **Controllers** are HTTP and authorization boundaries. Public controllers under Controllers/Public; protected staff controllers under Controllers/Admin.
- **DTOs** validate request/response shapes; do not expose raw EF entities or password hashes.
- **Services** own court/venue/staff rules, validation and coordination.
- **Repositories** query and stage EF entities; **IUnitOfWork** saves transactions.
- **Data** maps nine SQL-first tables and relationships. SQL functions, exclusion constraint, triggers, check constraints, indexes remain canonical.
- **Security** uses staff_users table, Identity PasswordHasher (not full Identity tables), protected HttpOnly cookie, CSRF on modifying admin API calls, role/active lookup per request, and an owner bootstrap CLI command.
- **Health** /health (process) and /health/db (database/schema).

### Staff authorization

- OWNER: staff management, global venue settings and booking policies, courts, operating hours.
- MANAGER: court management, operating hours, read venue settings.
- STAFF: read admin views only; no write access in Phase 3.
- Public: venue branding, hours and active court list; no staff password or secret fields.
- Owner creation is one-time via `--bootstrap-owner` CLI reading `Bootstrap:Owner*` secrets, only with zero staff records.
- Cookie role/active state and password fingerprint checked against current database on each authenticated request. Password changes invalidate previous cookies. Cookie sessions expire after 8 hours (no sliding). No stateless JWT/refresh token.
- All unsafe `/api/v1/admin` methods require `X-CSRF-TOKEN` obtained from `/api/v1/admin/auth/csrf`. Local cross-origin use requires credentials and explicit CORS. Production deploy via a trusted single-origin HTTPS reverse proxy.
- Secure password recovery for a lost OWNER password is not yet implemented; do not expose insecure recovery endpoints.

### Court and venue rules

- Courts created/updated with name, description, base hourly rate, display order, active state. SQL unique case-insensitive court name index still protects races. No physical deletes via the API.
- Deactivating a court with future active reservations is rejected; inactive courts don't appear in public listing.
- Venue name/slug/logo/colors/timezone/currency and booking policy values editable by OWNER. Logo URL HTTPS-only.
- Venue operating hours: all seven weekday records validated (0 Sunday → 6 Saturday), closed days no hours; open days require closesAt > opensAt. Currently same-day hours only.
- Rich pricing rules, live availability and booking lifecycle are Phases 4–5.

## PostgreSQL ownership

Existing tables: venue_settings, staff_users, courts, operating_hours, pricing_rules, customers, court_schedule_entries, bookings, payments.
No schema was changed in Phase 3. See [database-migrations.md](../database-migrations.md); do not auto-apply an EF migration to initialized tables.

## Implementation status

Phase 2 is the parent of the Phase 3 feature branch until merged. Tests and full live DB integration require a developer-side .NET runtime; see progress.md.
