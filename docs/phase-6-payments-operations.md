# Phase 6 — payments and venue operations

Phase 6 adds **manual verification**, not an automatic GCash/bank payment gateway. It uses the existing SQL-first `payments`, `bookings` and `court_schedule_entries` tables. No schema reset or migration is run.

## Payment workflow

1. Guest creates a Phase 5 online booking (`HELD`), with an access token and short hold expiry.
2. Guest submits **full booking amount** as reported on a GCash/bank-transfer receipt plus a required 3–150-character transaction reference and a PNG/JPEG/WebP/PDF proof file (maximum 5 MiB). The amount/reference are *unverified claims*; saving a proof **does not mean funds were received**.
3. The server stores proof privately, changes `HELD → AWAITING_REVIEW`, writes `payments.status=SUBMITTED` and extends review expiry to min(current time + `review_timeout_hours`, booking start). A failed database operation cleans up the new file.
4. An OWNER or MANAGER checks the proof against real payment-account records. **Approve:** `SUBMITTED → VERIFIED`, and for a valid unexpired online booking, `AWAITING_REVIEW → CONFIRMED`. **Reject:** `SUBMITTED → REJECTED`; pending online booking becomes `EXPIRED`, freeing court time.
5. If a submitted payment becomes expired before review, approval fails; staff must reconcile real funds manually, and may need to refund outside the system. Never assume an expired booking means no money was transferred.
6. Phase 5 guest cancellation is blocked while a payment is SUBMITTED/VERIFIED. Confirmed reservations require authorized staff cancellation; verified payment records remain for reconciliation.
7. STAFF can record received CASH/GCASH/BANK_TRANSFER/OTHER payments against a **confirmed** booking, including partial amounts up to the outstanding balance. This creates a `SUBMITTED` claim requiring OWNER/MANAGER verification. There is no automated settlement.
8. On a cancelled booking, authorized staff may **record an already-completed external refund** with a required refund reference (`VERIFIED → REFUNDED`); the API does **not** send refunds or connect to a financial provider.

**Financial integrity rules:** no overpayment of verified balance; don't approve twice; one pending SUBMITTED payment per booking; all operations serialize on the booking schedule row. For GCash/bank verification, a transaction-scoped PostgreSQL advisory lock serializes approvals with the same normalized method/reference, and verified duplicate references are rejected; statuses and timestamps persist to PostgreSQL. The API always computes balance from VERIFIED payments, excluding REJECTED/REFUNDED. Payment proofs, transaction references and guest details never appear in public availability.

## Private payment-proof storage

Configure `ProofStorage:Directory` as an **absolute persistent directory outside wwwroot**, with write permission for the API server. For local macOS development, an example is `/Users/your-mac-user/pickleball-private-proofs`. Configure through user-secrets or environment, not Git. The repository ignores uploaded proof directories, not AGENTS.md or context wiki.

The server limits uploads to 5 MiB; checks file headers for PNG, JPEG, WebP and PDF, ignores user-supplied filenames, assigns a random storage key and only retrieves keys matching its restrictive pattern. A signed-in staff account retrieves an image proof from the protected preview route; PDFs are sent as attachments instead of rendering inline. Client-side form previews are a frontend task in Phase 7. Scanning images/PDFs for malware and managed object storage are **production hardening tasks**, as is shared/persistent storage across multiple API replicas. No private file is served from `wwwroot`.

The `ProofStorage:Directory` setting is required before guest proof submissions. Without it, the operation fails closed; the application should not silently fall back to a temporary or public folder.

## Guest routes

```text
POST /api/v1/bookings/{code}/payments    multipart/form-data:
    PaymentMethod=GCASH|BANK_TRANSFER
    Amount=250.00
    TransactionReference=EXAMPLE-TRANSFER-REFERENCE
    Proof=<file>
    header X-Booking-Token: <Phase 5 booking access token>

GET /api/v1/bookings/{code}/payments
    header X-Booking-Token: <token>
```

Submit is rate limited and requires a valid unexpired HELD booking; the amount must equal `bookings.total_amount`. It returns a `PaymentResponse` with method/amount/status/timestamp, never the raw private storage path. Guest GET returns verified sum and balance due.

## Admin routes

| Method | Route | Role |
| --- | --- | --- |
| GET | `/api/v1/admin/payments/pending` | OWNER, MANAGER, STAFF |
| GET | `/api/v1/admin/payments/bookings/{code}` | OWNER, MANAGER, STAFF |
| GET | `/api/v1/admin/payments/{id}/proof` | OWNER, MANAGER, STAFF |
| POST | `/api/v1/admin/payments/bookings/{code}` | OWNER, MANAGER, STAFF + CSRF; record external payment |
| POST | `/api/v1/admin/payments/{id}/approve` | OWNER/MANAGER + CSRF |
| POST | `/api/v1/admin/payments/{id}/reject` | OWNER/MANAGER + CSRF |
| POST | `/api/v1/admin/payments/{id}/record-refund` | OWNER/MANAGER + CSRF |

All mutations require the existing Phase 3 cookie and `X-CSRF-TOKEN` header. `GET /admin/payments/pending` returns up to 100 latest pending payments; full history of a booking is available through `/admin/payments/bookings/{code}`. These are backend APIs; Next.js admin review UI is Phase 8.

## Manual reservations and court maintenance

- `POST /api/v1/admin/operations/manual-bookings` (any staff): send court/date/start/end, guest name/contact, optional notes, and Channel `WALK_IN`, `PHONE`, or `MESSENGER`. Booking is **CONFIRMED** immediately, even if unpaid, and appears in the same schedule as online bookings. Backend calculates price; overlaps return HTTP 409. Returns a signed guest-access token that staff may privately share with the customer.
- `GET /api/v1/admin/operations/blocks?date=YYYY-MM-DD` (any staff): inspect blocks for the selected venue-local day.
- `GET /api/v1/admin/operations/availability?date=YYYY-MM-DD` (any staff): server-calculated status overlay for limited current-slot WALK_IN_NOW availability.
- `POST /api/v1/admin/operations/blocks` (OWNER/MANAGER): add a future maintenance block with reason, within available venue slots. SQL overlap constraint rejects conflicts.
- `POST /api/v1/admin/operations/blocks/{id}/remove` (OWNER/MANAGER): mark a block CANCELLED; do not delete historical entries.

**Schema limitation:** `bookings` has no dedicated `booking_source` column. Until a reviewed EF/SQL migration is available, manual booking channels are stored with an explicit `[CHANNEL:WALK_IN]` (etc.) prefix in `bookings.notes` and linked to the creating staff ID in `court_schedule_entries.created_by_staff_id`. The source prefix is **not** yet a first-class indexed or guaranteed structured field. Do not imply it is. Report/filtering by source should wait for an approved migration.

**Post-Phase-9 Phase 1 update:** Manual PHONE and MESSENGER bookings still require future complete venue slots. Authenticated WALK_IN bookings may select a currently started slot within min(half the configured slot duration, 30 minutes) if a batched active schedule check finds no persisted overlap. This is verified again inside the creation transaction; PostgreSQL GiST exclusion continues to prevent overlapping bookings. The public booking route and all court blocks retain strict future-only rules. See [usability implementation](improvements-phase-1-admin-usability.md).

## Running and testing

1. Ensure the existing PostgreSQL 17 Docker instance is running and `/health/db` returns HTTP 200. Do not rerun schema initialization or reset Docker volumes.
2. Configure `ConnectionStrings:Pickleball`, `Booking:SigningKey` and `ProofStorage:Directory` via user-secrets. Back up the signing key separately, and use a private persistent storage folder.
3. Run `dotnet restore PickleballBooking.slnx`, `dotnet build PickleballBooking.slnx`, `dotnet test PickleballBooking.slnx` and `dotnet run --project backend/Pickleball.Api`.
4. On a **disposable PostgreSQL test database**, verify: guest hold → proof submit → review → confirmed, rejected proof → expired slot, duplicate submit/review rejection, payment balance, guest cancellation guard, confirmed staff manual booking, overlapping block rejection, block removal, uploaded image preview and non-access without staff auth.
5. Verify the existing expiry worker: unreviewed `AWAITING_REVIEW` expires after review deadline.
6. Confirm file durability and reverse-proxy HTTPS/secure cookies in production. Malicious file scanning and payment-provider reconciliation are operator responsibilities until explicitly integrated.

This Phase 6 implementation is source-only until actual .NET builds and integration tests have passed. Phase 7 is the customer frontend, Phase 8 is the admin frontend.

## Current policy since 2026-11-03

The original Phase 6 implementation had a four-hour `AWAITING_REVIEW`
deadline. This has been intentionally removed. Proof accepted before the
booking's initial 10-minute HELD deadline sets `AWAITING_REVIEW` with
`expires_at = NULL`; the court remains reserved and cannot be double-booked.
Only management's actual verified approval, rejection, or a reasoned staff
cancellation can release/resolve it. Late review approval is permitted after
scheduled start and never automatically triggers a refund. The old
`review_timeout_hours` DB field is deprecated and ignored.

The staff Today/Payments views now highlight payment reviews older than
one hour, games starting within one hour, and reviews needing reconciliation.
These are in-app reminders only; no automatic email/SMS delivery is configured.
Unreviewed bookings need active monitoring, especially near game time.
