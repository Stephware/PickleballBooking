# Architecture and data model

## Deployment model

One reusable codebase, separately deployed per pickleball venue with its own PostgreSQL database. The SQL-first schema is **single-venue** (`venue_settings.id = 1`), so no `venue_id` discriminator is needed in every table. The frontend remains a Next.js 16 + TypeScript + Tailwind starter awaiting real booking/admin features.

## Phase 2 backend layers

- `Models/Entities/` — nine POCO entities corresponding to the nine existing tables. SQL status strings are kept as constants in `Models/Enums/BookingStatuses.cs`, not implicitly converted into PostgreSQL enums.
- `Data/PickleballDbContext.cs` — EF Core context; mappings are loaded from `Data/Configurations/` for every entity and preserve SQL-first table/column names, identity semantics, types and foreign keys.
- `Data/PickleballDbContextFactory.cs` — design-time context using user-secrets/env configuration; no automatic schema changes.
- `Repositories/` — venue, court, schedule and booking repositories. Write methods stage changes; `IUnitOfWork` coordinates `SaveChangesAsync` and transactions.
- `Extensions/DatabaseServiceExtensions.cs` — conditional PostgreSQL DI setup. If no local connection string exists, regular `/health` still responds and `/health/db` reports unhealthy.
- `Health/PostgresSchemaHealthCheck.cs` — read-only check for a connection, nine required tables and the existing venue row; no external SQL or sensitive details returned.
- `backend/tests/` — metadata unit tests and gated live integration tests.

**No CRUD controllers or booking business services are exposed in Phase 2.** Roles, write authorization, booking conflict handling and payment flows belong to later phases.

## Canonical nine tables

| SQL table | C# entity |
| --- | --- |
| venue_settings | VenueSettings |
| staff_users | StaffUser |
| courts | Court |
| operating_hours | OperatingHour |
| pricing_rules | PricingRule |
| customers | Customer |
| court_schedule_entries | CourtScheduleEntry |
| bookings | Booking |
| payments | Payment |

## PostgreSQL-specific behavior

- `btree_gist` enables the GiST exclusion constraint `ex_court_active_time_overlap` that rejects overlapping active bookings and blocks.
- Functional case-insensitive indexes, `updated_at` triggers, SQL check constraints, generated booking codes and `expire_pending_schedule_entries()` remain managed by `database/sql/01_schema.sql` rather than being silently rebuilt by EF conventions.
- `timestamptz` maps to `DateTime` and **must use UTC**; `time` maps to `TimeOnly`. The venue timezone is a separate setting (initially Asia/Manila).
- Expired pending schedule entries remain active until their status is explicitly changed to `EXPIRED`; a future service/worker will perform that transition. A read-only availability query alone cannot eliminate the concurrency race.
- The current schema lacks specialized per-court overnight hours and secure booking-access tokens; those are future reviewed migrations.

## Migrations

See [docs/database-migrations.md](../database-migrations.md). The schema already exists, and EF's initial generated migration would otherwise try to create duplicate tables. **No migrations are applied or auto-run in Phase 2**. Generate the baseline and snapshot only in a local .NET-enabled environment, review it against a disposable copy first, and keep the original bootstrap SQL for new venues.

## Source of truth

`database/sql/01_schema.sql` for current SQL objects, mapped entity configurations for EF, and context wiki for product decisions. Keep the actual database/volume untouched during scaffolding.
