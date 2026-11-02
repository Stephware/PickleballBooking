# Booking and schedule workflows

## Availability on selected date

1. Take the selected venue-local date and its timezone (initially Asia/Manila).
2. Load active courts, weekday hours, current pricing rules and schedule entries that overlap the requested day.
3. Generate slots based on venue slot_minutes; do not store empty AVAILABLE rows.
4. Derive labels in order: closed/inactive → unavailable; elapsed → elapsed (unless a historical booking detail view is requested); owner block → blocked; held/awaiting review → pending; confirmed/completed → occupied; otherwise available.
5. User selects only an available slot. The API must validate availability and price again when the reservation is submitted.

| UI label | Color / origin |
| --- | --- |
| AVAILABLE | Green — within hours and no active overlapping entry |
| OCCUPIED | Red — confirmed or completed booking |
| PENDING | Yellow — active HELD or AWAITING_REVIEW entry |
| ELAPSED | Gray — slot is already in the past; never bookable |
| BLOCKED / CLOSED | Distinct unavailable state — blocked/closed/inactive |

Accessible labels and icons accompany colors.

## Reservation flow (planned, not implemented)

1. Player chooses date/court/allowed slots.
2. Backend validates booking notice, hours, active court, slot length, and price.
3. In a transaction, expire timed-out pending entries and insert a HELD court_schedule_entries row with expires_at; create the related bookings row.
4. If PostgreSQL rejects an overlapping active entry (SQLSTATE 23P01), show a friendly conflict message and refresh availability. Adjacent time windows are valid.
5. If venue requires payment proof: record payment proof storage reference and payments row; transition to AWAITING_REVIEW with expiry deadline. Owner approval transitions to CONFIRMED and clears expires_at; rejection or cancellation frees the court.
6. Periodically expire pending entries via worker and/or in availability/booking transactions. Database constraints alone do not auto-expire stale holds.

## Owner workflow

- Staff enters walk-in, call, and Messenger reservations in the SAME schedule table to prevent offline/online conflicts.
- Staff can block/unblock available court periods and verify/reject payment submissions.
- Preserve booking and payment history by status transitions rather than deleting records.

**Important:** ELAPSED and AVAILABLE are UI calculations, not database schedule statuses. COMPLETED is persisted; payment statuses are stored in payments.
