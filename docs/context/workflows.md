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

Guest tokens and deterministic codes require a durable per-venue signing secret; they don't need new DB columns. Payment review and source tagging are implemented in Phase 6; see below.

## Payment handling and staff operations (Phase 6 source)

1. Guest receives a HELD booking from Phase 5. They submit full quoted amount as a GCash/bank receipt and private proof file with the HMAC bearer token.
2. While HELD and unexpired, backend stores receipt and changes status to AWAITING_REVIEW until min(now + venue review_timeout_hours, booking start). Payment row starts SUBMITTED, not VERIFIED.
3. Owner/Manager compares receipt against actual funds; approval atomically marks payment VERIFIED and schedule CONFIRMED. Rejection marks payment REJECTED and pending schedule EXPIRED. Late proofs require manual reconciliation, never automatic financial claims.
4. Guest cancellation is refused while a payment is pending or verified. Staff can cancel eligible confirmed reservations; verified payments remain in the ledger until an **external** refund is recorded.
5. Staff may create confirmed future bookings via WALK_IN, PHONE or MESSENGER, all passing the same availability/pricing rules, with no overlap. Payment can be recorded later as a claim awaiting manager verification.
6. Staff can view blocks; Owner/Manager can add/remove future maintenance blocks in the same GiST-protected schedule. Source channel prefix in booking notes is a documented schema limitation.

See [Phase 6 guide](../phase-6-payments-operations.md) for authentication, proof previews, size limits, pending payments, and refund caveats.

## Previously planned staff workflows (remaining)



Staff enters Messenger, phone, and walk-in reservations in the same schedule. Staff may block/unblock courts and review payments. Maintain booking/payment history using status transitions rather than deleting records.

**Phase 9 executed the backend/player/admin integration against disposable PostgreSQL. See the verification report for coverage and limits.**

## Phase 7 player web flow (implemented in Next.js source)

1. Server retrieves public venue branding (non-operational fallback if unreachable), client fetches selected date's court grid.
2. Player selects one AVAILABLE slot, optionally extends to adjacent AVAILABLE slots on the same court (maximum 8), and reads server-supplied estimate.
3. Form collects full name and phone or email. It uses UUID v4 idempotency; unchanged retries preserve the same key.
4. Next.js server-only gateway creates the hold, accepts the HMAC guest token from .NET and stores it in an HttpOnly cookie without returning it to browser JavaScript.
5. /booking/{code} fetches private status using server-side token forwarding, displays deadlines and offers cancellation where allowed.
6. For HELD paid bookings, player uploads bank/GCash payment proof with local image preview. Status transitions to AWAITING_REVIEW only; owner/manager approval remains Phase 6 protected backend functionality and Phase 8 UI.
7. A venue-provided token may be entered for cross-device access, but online booking creation intentionally doesn't export tokens; verified cross-device recovery is deferred.

The frontend is a UI over the backend rules. It cannot make an expired, blocked, booked or pending slot available by itself. API downtime disables booking.


## Phase 8 staff workflows — Next.js admin source

1. Owner creates staff via existing CLI/bootstrap or authorized admin Team accounts; staff logs in at /admin through the same .NET cookie/CSRF authentication.
2. Staff views today's reservations, pending proof queue, active courts; can create future confirmed manual bookings, record externally received cash/transfer claims, view maintenance blocks and proof previews.
3. Owner/Manager confirms eligible held bookings or cancels eligible reservations. They review pending payment amount, reference and private receipt next to controls and compare to **real external bank/GCash settlement** before approve/reject.
4. Approved online proof may change AWAITING_REVIEW to CONFIRMED. Rejection expires the held slot; late/expired bookings may still need manual financial reconciliation.
5. Owner/Manager can add/remove maintenance blocks, create/edit courts, edit peak pricing and operating hours. Owner can change venue brand/booking policies and manage staff accounts.
6. Refund record requires previously completed external payment reversal. Neither the frontend nor API sends refunds.
7. Account password change clears frontend cookies and requires reauthentication; logout clears staff session.

All sensitive actions go through the allowlisted Next.js server-side admin gateway; .NET remains the authority for role/CSRF and PostgreSQL transaction safety. See [Phase 8 details](../phase-8-owner-staff-dashboard.md).

## Phase 9 verified safeguards

Real API/browser checks executed guest selection → HELD → receipt SUBMITTED/AWAITING_REVIEW → staff private preview/approval → CONFIRMED. Other executed API scenarios cover idempotency replay/changed intent, concurrent exclusion, guest/payment cancellation boundaries, manual booking, maintenance overlap/removal, verified balances, external refund history and staff deactivation.

Production-image checks exercise the anonymous→authenticated CSRF handshake across the trusted internal HTTP hop, per-client rate buckets and persistent staff/guest/proof access after application-container recreation. Refund references cannot be recycled into another verified payment. A refund remains an external action recorded by staff, not a transfer performed by this application.

Actual test counts, skipped tests, browser fixture boundaries and remaining launch gates are recorded in [Phase 9](../phase-9-final-verification.md).
