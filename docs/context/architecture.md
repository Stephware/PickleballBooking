# Architecture and data model

## Deployment model

One shared source code repository; **separate app deployment and PostgreSQL database per venue**. The existing schema is intentionally single-venue: it has one venue_settings row and does not add a venue_id column to every table.

- Browser: venue-branded Next.js + TypeScript UI (planned)
- API: ASP.NET Core .NET 10 (minimal scaffold, only GET /health implemented)
- Data: PostgreSQL 17 managed using Docker and inspected with DBeaver
- Domain and branding: independent per venue; configurable logo, colors, court names, rates and policy

Separate databases should use distinct Compose project names, ports and secrets. Do not hardcode a venue's court count or copy entire codebases per customer.

## Files

- backend/Pickleball.Api: .NET 10 API project
- frontend: placeholder; actual Next.js project not yet initialized
- database/compose.yaml and database/sql: original DB starter configuration and scripts
- PickleballBooking.slnx: root solution
- AGENTS.md and docs/context: Git-tracked guidance and wiki

## Nine tables

| Table | Purpose |
| --- | --- |
| venue_settings | One venue's identity, branding, timezone and booking options |
| staff_users | Basic owner/manager/staff records; not a full Identity implementation |
| courts | Any number of courts, names, order, base rate and active state |
| operating_hours | Venue-wide hours by weekday; overnight hours not supported |
| pricing_rules | Court-specific / weekday / peak-time pricing |
| customers | Optional customer directory |
| court_schedule_entries | One occupancy source for holds, booked time and blocks |
| bookings | Customer snapshot, booking code, price and deposit |
| payments | Transaction method, amount, proof pointer and review state |

## Concurrency and time

The schema's PostgreSQL btree_gist exclusion constraint prevents overlaps between active entries for the same court. Adjacent half-open time ranges are permitted. A background worker/API must move expired HELD/AWAITING_REVIEW entries to EXPIRED before their slots are free. ELAPSED is derived for the UI, not a database booking status. Convert timestamps using each venue's timezone; Asia/Manila is the starting default.

## Boundaries

Frontend branding and layout are application concerns; base theme values are currently stored in venue_settings. Advanced per-court hours, overnight bookings, richer theme templates and ASP.NET Identity require future schema/application design. Use versioned EF Core migrations after mapping the current schema; never reinitialize a populated database.
