# Phase 5 — reservation engine and temporary holds

**Scope:** API reservation/hold creation, status lookup, guest cancellation, staff confirmation/cancellation, daily staff listing, and automatic expiry. No payment collection, payment verification, QR integration, or booking/frontend UI yet (Phases 6–8). This branch is stacked on Phase 4 and has no schema changes.

## API contract

| Verb | Route | Access |
| --- | --- | --- |
| POST | `/api/v1/bookings` | Guest, IP rate-limited |
| GET | `/api/v1/bookings/{bookingCode}` | Guest, requires `X-Booking-Token` header |
| POST | `/api/v1/bookings/{bookingCode}/cancel` | Guest + token; HELD/AWAITING_REVIEW only |
| GET | `/api/v1/admin/bookings?date=YYYY-MM-DD` | OWNER/MANAGER/STAFF |
| POST | `/api/v1/admin/bookings/{bookingCode}/confirm` | OWNER/MANAGER + staff cookie + CSRF |
| POST | `/api/v1/admin/bookings/{bookingCode}/cancel` | OWNER/MANAGER + staff cookie + CSRF |

All guest endpoints use the existing explicit CORS allowlist; API registration/cancellation/lookup are IP rate-limited. Staff routes use Phase 3 auth and antiforgery middleware.

### Creating a hold

```http
POST /api/v1/bookings
Content-Type: application/json

{
  "idempotencyKey": "3f81f7f2-ea65-4c6d-8f3a-865e700eb7ea",
  "courtId": 1,
  "date": "2026-11-04",
  "startsAt": "09:00",
  "endsAt": "11:00",
  "guestName": "Example Player",
  "guestPhone": "09171234567",
  "guestEmail": null,
  "notes": null
}
```

Example date/time above is illustrative; use a valid future date inside that venue's booking window. Generate a **new random UUID v4** for each *intended* reservation and reuse it only when retrying the same submission (browser: `crypto.randomUUID()`). Never reuse it for another booking.

HTTP 201 returns `{booking: {...}, accessToken: "..." }` with a booking code, status `HELD`, UTC start/end, server-calculated amount, currency, and `expiresAtUtc`. The **accessToken is a bearer secret**. The frontend must display it only to the booking's creator and keep it private; don't put it in URL query params, analytics, or server logs. Do not store in localStorage if an appropriately protected browser session is available.

If submitted again with the same UUID and identical reservation details, the server returns the existing booking/token instead of inserting a duplicate. A same-UUID different-intent request returns 409. Simultaneous same-key submits may receive 409 while the first request commits; retry unchanged to retrieve the prior booking.

### Booking range

- 1–8 consecutive, complete, aligned venue slots inside the venue's same-day operating hours.
- No partially elapsed slots; respect the venue's advance-booking window, minimum notice and active-court flag.
- Uses **Phase 4 availability/pricing within the database transaction**. Current pricing is recalculated on the backend; one atomic booking spans the requested consecutive slots. Phase 9 corrects fractional-cent accumulation: the total is the sum of exact server-calculated slot amounts, rounded once for the entire reservation and snapshotted in `bookings.total_amount`. Individually displayed rounded slot quotes are estimates and may sum to a slightly different amount.
- Pending `HELD` reservation expires after `venue_settings.hold_minutes` (never later than the booking start). No payment is taken in Phase 5.
- Inserts `court_schedule_entries` and `bookings` together in a transaction. The PostgreSQL GiST exclusion `ex_court_active_time_overlap` is the final guard against concurrent overlapping bookings. An overlap or unique key collision returns 409, never a double-booked confirmation.

### Guest lookup and cancellation

Supply `X-Booking-Token` obtained at creation. An invalid token or unknown booking code returns **404** without revealing whether a code exists. The HMAC key is configured per venue and remains stable across app restarts/deployments; token derived using a distinct domain from the idempotency booking code.

Guest cancellation is permitted only **before the start** while status is `HELD` or `AWAITING_REVIEW`. Once confirmed, changes/refunds require staff action. Status updates are atomic conditional SQL updates, protecting against simultaneous confirm/expire/cancel. Owner/Manager may confirm an unexpired HELD booking or cancel an unstarted HELD/AWAITING_REVIEW/CONFIRMED booking.

### Expiry

The `PendingBookingExpiryWorker` runs on the API server every 30 seconds (with an initial pass on startup), executing existing SQL `expire_pending_schedule_entries()`. Each create/confirm/cancel transaction also invokes the SQL expiry function before changing rows. `expires_at` alone NEVER frees a slot: status must become `EXPIRED` so the GiST exclusion no longer applies. Availability may temporarily show `PENDING` until the background worker/next booking transaction executes.

Worker is best-effort and reports failures; if running several API replicas, each can run this idempotent SQL transition. Never rely on browser timers to expire bookings.

## Configuration (secret required)

Configure one persistent **random 32+-byte** `Booking:SigningKey` for this venue via user-secrets or environment variables, not Git. Example from repository root:

```zsh
BOOKING_SIGNING_KEY=$(openssl rand -hex 32)
dotnet user-secrets set "Booking:SigningKey" "$BOOKING_SIGNING_KEY" --project backend/Pickleball.Api
unset BOOKING_SIGNING_KEY
```

Use the same secret on all replicas **of the same venue**; different venues use different secrets. **Back it up securely** and do not rotate casually: rotation invalidates guest access tokens and changes the booking code derived from an idempotency key. This intentionally avoids adding migration tables to the existing nine-table database, but a later authenticated booking account/session or stored token/recovery workflow may be appropriate.

Also set `ConnectionStrings:Pickleball` using the Phase 2 instructions; never send real credentials in chat. If signing secret is absent, create/lookup/cancel fail safely; process health still works.

## Operator verification

```bash
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

Check `/health/db` is 200 before testing. Choose an active court with configured hours, real date/time that is not elapsed, and ensure future slots are AVAILABLE. Confirm the 201 response; retry exactly the same JSON and verify no second schedule entry exists. Try an overlapping booking on a different UUID (409). Cancel with its guest token and verify availability returns AVAILABLE after status update. Try staff confirm/cancel with the Phase 3 cookie and CSRF. For expiry testing on a disposable database set a small `hold_minutes` and wait until the worker transitions to EXPIRED.

Integration test `PostgresOverlapTests` is **disabled by default** and should only run when `PICKLEBALL_TEST_CONNECTION_STRING` points at an isolated disposable test database **and** `PICKLEBALL_TEST_MUTATIONS_ENABLED=1`. It uses rollback; do not point it at production data.

## Intentionally deferred

Payment proof, deposits, admin payment approval, actual guest reservation UI, self-service cancellation policies for confirmed/paid bookings, staff-entered walk-in source tagging, e-mail/SMS notifications, recurring/multi-court bookings, and server-issued account-based recovery. Phase 6 will expand HELD → AWAITING_REVIEW → CONFIRMED with payment verification. The current schema's `required_deposit` is set to 0 in Phase 5; this is **not** a completed paid reservation flow.

**No database migration, SQL bootstrap modifications, or Docker volume operations occur in Phase 5.**
