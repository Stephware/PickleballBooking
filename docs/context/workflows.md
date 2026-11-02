# Booking and schedule workflows

## Availability + pricing (implemented as Phase 4 source)

1. Accept venue-local date plus optional court ID, load `venue_settings`, operating hours and active courts.
2. Use per-venue timezone and `slot_minutes` to generate complete slots inside same-day open/close times. Skip DST invalid/ambiguous local boundaries; return closed days without slots.
3. Load one batch of active `court_schedule_entries` covering the date; resolve each slot using half-open UTC overlaps `[start,end)`.
4. Status precedence: already started → **ELAPSED**; otherwise active block → **BLOCKED**; confirmed/completed → **OCCUPIED**; HELD/AWAITING_REVIEW → **PENDING**; inside minimum notice → **UNAVAILABLE**; otherwise **AVAILABLE**. A hold remains pending until status becomes EXPIRED, even if `expires_at` is in the past.
5. Price is server-computed: match active pricing rules by court/day/time; prefer court-specific > venue-wide, then greater priority, then newer ID. Split partial-hour overlaps and prorate each segment. Fall back to court base rate. Currency from venue settings. Quote is estimated at current rates.
6. Return status plus accessible text label alongside semantic colors in the future UI. Closed or inactive courts never display available slots.

## Pricing rule management (Phase 4)

OWNER or MANAGER creates/updates/deactivates `pricing_rules`; STAFF can read. Admin CSRF required for mutations. No physical delete. Changing rules affects future quotes but does not retroactively adjust stored `bookings.total_amount`.

## Booking holds and confirmed reservations (planned Phase 5)

1. Player chooses an AVAILABLE date/court/slot, with contact information.
2. Backend validates hours, timezone, notice, booking horizon and current pricing again within a transaction; front-end totals are not authoritative.
3. Insert HELD schedule row with `expires_at` and related booking snapshot. Rely on PostgreSQL `ex_court_active_time_overlap` exclusion constraint so concurrent users cannot double-book; catch SQLSTATE 23P01 and return HTTP 409.
4. Payment proof may transition to AWAITING_REVIEW, approval to CONFIRMED; cancellation to CANCELLED; expired holds to EXPIRED.
5. A worker and booking transaction explicitly transition overdue HELD/AWAITING_REVIEW rows to EXPIRED. Merely comparing expiry timestamp must **not** make a schedule row bookable while its active status still enforces exclusion.

## Staff operations (planned Phase 6)

Staff enters Messenger, phone, and walk-in reservations in the same schedule. Staff may block/unblock courts and review payments. Maintain booking/payment history using status transitions rather than deleting records.

**Availability is implemented as a read-only display calculation. The booking/payment operations above are not implemented yet.**
