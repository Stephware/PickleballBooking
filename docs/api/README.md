# API inventory — Phases 1–5

Phase 5 adds guest booking holds and staff management endpoints, but **does not implement payment processing or a player calendar UI**. Administrative writes require the Phase 3 staff cookie/CSRF; public slot and quote routes are read-only.

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

## Phase 5 — booking endpoints

| Method | Route | Authorization |
| --- | --- | --- |
| POST | `/api/v1/bookings` | Guest, rate limited, UUID v4 idempotency key |
| GET | `/api/v1/bookings/{bookingCode}` | Guest, `X-Booking-Token` bearer header, rate limited |
| POST | `/api/v1/bookings/{bookingCode}/cancel` | Guest, `X-Booking-Token`, rate limited |
| GET | `/api/v1/admin/bookings?date=YYYY-MM-DD` | Any staff |
| POST | `/api/v1/admin/bookings/{bookingCode}/confirm` | OWNER or MANAGER, CSRF |
| POST | `/api/v1/admin/bookings/{bookingCode}/cancel` | OWNER or MANAGER, CSRF |

POST create accepts idempotencyKey (UUID v4), courtId, date, startsAt, endsAt, guestName, guestPhone or guestEmail, optional notes. It reserves 1–8 consecutive configured slots, server-recalculates price and returns 201 containing `booking` and **private** `accessToken`. Same intent + same UUID returns the original booking; overlapping or changed-intent requests return 409. 404 is returned for guest lookup/cancellation with invalid token or unknown code.

The `/health/db` endpoint checks the nine-table SQL schema; the expiry worker processes timed-out holds through the existing SQL function. The API requires a persistent secret `Booking:SigningKey` (32+ bytes) from user-secrets/env for guest access. **No payment guarantee, customer frontend, or self-service confirmed-booking cancellation** exists in this phase.

[Full Phase 5 guide](../phase-5-booking-engine.md).
