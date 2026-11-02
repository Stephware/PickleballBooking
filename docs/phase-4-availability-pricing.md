# Phase 4 — Court availability and pricing

This phase implements **API read-only availability/price quotes and staff pricing-rule management**, not online reservations. The Next.js calendar and booking forms come in Phase 7. It builds on Phase 3, which builds on the unmerged Phase 2.

## Public endpoints

```http
GET /api/v1/availability?date=2026-11-03
GET /api/v1/availability?date=2026-11-03&courtId=1
GET /api/v1/pricing/quote?date=2026-11-03&courtId=1&startsAt=09:00
```

The availability response contains the venue-local date, timezone, currency, configured slot duration, closed-day flag, and an array of courts. Each court has slots with venue-local start/end, exact UTC instants, a derived status, and **server-computed estimated** price. It never contains customer names, booking IDs or payment details. The quote endpoint returns the corresponding price/status for a generated slot, not a reservation or payment guarantee.

**Statuses:**
- `AVAILABLE` (green): future and outside minimum-notice cutoff, no active overlap.
- `OCCUPIED` (red): confirmed/completed booking overlaps the slot.
- `PENDING` (yellow): HELD/AWAITING_REVIEW overlaps the slot, **even if `expires_at` is in the past until a worker/API actually changes status to EXPIRED**.
- `ELAPSED` (gray): the slot has already started at the current UTC instant.
- `BLOCKED` (separate blocked UI): maintenance/block overlaps; blocked wins over occupied/pending.
- `UNAVAILABLE` (separate disabled UI): outside minimum advance notice or other booking policy. Closed weekdays return `isClosed: true` and no generated slots.

Returned price is a quote at **current rules**, not the historical total of an old booking. Future booking APIs **must recalculate prices and availability inside a transaction**. A displayed AVAILABLE slot is never a guarantee that concurrent users cannot book it first.

## Slot generation

- Use venue `timezone` (default `Asia/Manila`) and `slot_minutes` from venue settings. Weekday is `DayOfWeek` (0 Sunday–6 Saturday).
- Respect same-day operating hours and the complete slot duration. Incomplete trailing intervals are excluded. Overnight business hours aren't supported in existing SQL.
- Resolve local wall-clock slots to UTC instants, then compare with `timestamptz` schedule entries by half-open intervals `[start,end)`. Adjacent bookings are allowed.
- Ambiguous and invalid DST local boundaries are **not offered**; fail closed rather than invent an offset. A later requirements change may need an explicit DST disambiguation UX.
- The public day query is constrained to one year of history and `booking_advance_days` ahead. No bookings can be made on past/elapsed slots.
- A single batched active schedule query is made across the selected active courts, not a query per court.
- Never treat an active HELD/AWAITING_REVIEW row as free by checking only `expires_at`. The PostgreSQL exclusion constraint still enforces those statuses until transitioned. Phase 5 will add expiration and booking transactions.

## Price calculation

A rule has optional `court_id` (null = venue-wide), optional `day_of_week` (null = every day), same-day start/end times, `hourly_rate`, `priority`, `is_active`.

For each slot, split on all applicable pricing-rule boundaries and select the winning rate for each resulting segment:

1. Court-specific rules win over venue-wide rules.
2. Within that scope, greater `priority` wins.
3. Equal priority: most recently created ID wins.
4. No applicable rule: use `courts.base_hourly_rate`.
5. Sum per-minute proportional amounts and round the final slot total to two decimal places, away from zero.

Example: Court base ₱250/hr, peak rate ₱400/hr from 19:00. A 18:00–20:00 slot costs **₱650**, not ₱500 or ₱800. Rates are read from the server; browser totals are never authoritative.

## Admin rule endpoints

All routes below use the Phase 3 cookie/CSRF protections.

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/v1/admin/pricing/rules` | Any logged-in staff |
| POST | `/api/v1/admin/pricing/rules` | OWNER or MANAGER; CSRF |
| PUT | `/api/v1/admin/pricing/rules/{id}` | OWNER or MANAGER; CSRF |
| PATCH | `/api/v1/admin/pricing/rules/{id}/deactivate` | OWNER or MANAGER; CSRF |

Rules are **soft-deactivated**, never deleted by the API, preserving references/history. A missing court ID or invalid day/time/rate is rejected. Rule editing applies to future quotes; it does not retroactively change stored booking totals.

## Verification

```bash
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

Configure the Phase 2 local user-secrets connection before querying the API. Check `/health/db` first. Phase 4 adds unit tests for rule precedence, partial intervals, weekend pricing, timezones/DST, cutoff handling, status resolution, multi-court batch queries and API authorization. Actual local build/runtime validation is still required.

**No migration or SQL schema changes are part of Phase 4.** The next phase implements atomic booking/expiry and must validate pricing/availability again at commit time.
