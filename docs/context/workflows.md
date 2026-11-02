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

## Booking holds and confirmed reservations (Phase 5 API source)

1. Guest submits court, date, a **1–8 consecutive aligned slot** interval, name/contact, and random UUID v4 idempotency key.
2. Server derives a deterministic booking code using a per-venue secret, then starts an EF Core transaction and calls the canonical SQL expiration function. Exact duplicate requests return existing booking/access token; changed intent using same key returns conflict.
3. Server checks Phase 4 slot statuses and recalculates all selected slot prices **inside the transaction**. It rejects inactive, elapsed, partial, blocked, occupied, pending or outside-policy slots. Pricing from the frontend is never authoritative.
4. Insert a HELD `court_schedule_entries` row with expiry followed by its `bookings` snapshot, both committed atomically. PostgreSQL `ex_court_active_time_overlap` rejects concurrent overlapping requests with SQLSTATE 23P01, surfaced as 409.
5. Create returns booking code and an HMAC guest bearer token once; guest status lookup and cancellation require `X-Booking-Token` header. Guest may cancel HELD/AWAITING_REVIEW before start; staff OWNER/MANAGER may confirm live HELD or cancel eligible unstarted bookings.
6. Worker runs `expire_pending_schedule_entries()` roughly every 30 seconds; mutations call it too. **Never make stale-but-active holds free solely by comparing expires_at**.

Guest tokens and deterministic codes require a durable per-venue signing secret; they don't need new DB columns. Payment review and source tagging are **Phase 6**, not implemented here.

## Staff operations (planned Phase 6)

Staff enters Messenger, phone, and walk-in reservations in the same schedule. Staff may block/unblock courts and review payments. Maintain booking/payment history using status transitions rather than deleting records.

**Phase 5 has booking API source but no payment processing or public/admin booking UI; actual .NET build, real DB transactions and concurrency behavior still need verification.**
