# API inventory — Phases 1–4

Phase 4 adds dynamic availability and rate management, but **does not create bookings, payments or a player calendar UI**. Administrative writes require the Phase 3 staff cookie/CSRF; public slot and quote routes are read-only.

## Public and infrastructure

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | Process health |
| GET | `/health/db` | PostgreSQL/nine-table/venue check |
| GET | `/api/v1/system/status` | API process status |
| GET | `/api/v1/venue` | Venue branding |
| GET | `/api/v1/venue/hours` | Opening hours |
| GET | `/api/v1/courts` | Active court list |
| GET | `/api/v1/availability?date=YYYY-MM-DD[&courtId=1]` | Venue-local day, courts, slots, status and estimated prices |
| GET | `/api/v1/pricing/quote?date=YYYY-MM-DD&courtId=1&startsAt=09:00` | One generated slot's current price and status |

## Staff and admin

| Method | Route | Role |
| --- | --- | --- |
| GET | `/api/v1/admin/auth/csrf` | Anonymous; issues CSRF |
| POST | `/api/v1/admin/auth/login` | Anonymous, CSRF and throttling |
| POST | `/api/v1/admin/auth/logout` | Any staff, CSRF |
| POST | `/api/v1/admin/auth/change-password` | Any staff, CSRF |
| GET | `/api/v1/admin/auth/me` | Any staff |
| GET/POST | `/api/v1/admin/staff` | OWNER |
| PATCH | `/api/v1/admin/staff/{id}/active` | OWNER, CSRF |
| POST | `/api/v1/admin/staff/{id}/reset-password` | OWNER, CSRF |
| GET/POST | `/api/v1/admin/courts` | GET any staff; POST OWNER/MANAGER CSRF |
| GET/PUT | `/api/v1/admin/courts/{id}` | GET any staff; PUT OWNER/MANAGER CSRF |
| GET/PUT | `/api/v1/admin/venue` | GET any staff; PUT OWNER CSRF |
| GET/PUT | `/api/v1/admin/venue/hours` | GET any staff; PUT OWNER/MANAGER CSRF |
| GET | `/api/v1/admin/pricing/rules` | Any staff |
| POST | `/api/v1/admin/pricing/rules` | OWNER/MANAGER, CSRF |
| PUT | `/api/v1/admin/pricing/rules/{id}` | OWNER/MANAGER, CSRF |
| PATCH | `/api/v1/admin/pricing/rules/{id}/deactivate` | OWNER/MANAGER, CSRF |

## Sample response fields

`GET /api/v1/availability?date=2026-11-03` returns:
- `date`, `timezone`, `currency`, `isClosed`, `slotMinutes`
- `courts[]`: `courtId`, `courtName`, `slots[]`
- `slots[]`: `startsAt`, `endsAt` (local time), `startsAtUtc`, `endsAtUtc`, `status`, `totalPrice` (estimated)

Status values: `AVAILABLE`, `OCCUPIED`, `PENDING`, `ELAPSED`, `BLOCKED`, `UNAVAILABLE`. A closed day may have no slots. No personal data is returned.

A quote returns `date`, `courtId`, `startsAt`, `endsAt`, `currency`, `totalPrice`, `availabilityStatus`. Neither endpoint reserves anything or guarantees the slot remains free. The Phase 5 booking API must recompute prices/availability under a transaction.

[Detailed pricing/availability rules](../phase-4-availability-pricing.md) | [Phase 3 authentication](../phase-3-authentication.md).
