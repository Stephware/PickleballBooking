# Architecture and data model

One reusable deployment/codebase, separately configured PostgreSQL database per pickleball venue. The original SQL-first nine-table schema remains the source of truth. No schema changes in Phases 4–5.

## API layering
- `Controllers/Public/`: public venue/court APIs plus `AvailabilityController` and `PricingController` (read-only).
- `Controllers/Admin/`: cookie-authenticated owner/manager/staff routes including `PricingRulesController`; unsafe calls require CSRF.
- `DTOs/`: request/response contracts, no customer names or booking IDs in availability responses.
- `Services/Availability/`: `AvailabilityService`, pure `AvailabilityCalculator`, `LocalTimeSlots` (local times → UTC).
- `Services/Pricing/`: `PricingService` admin CRUD and pure `PricingCalculator` server-side pricing.
- `Repositories/`: SQL-first EF query/persistence; `ScheduleRepository.ListActiveInRangeAsync` returns one batched list, `PricingRuleRepository` handles rules; `IUnitOfWork` coordinates saves.
- `Models/Entities/`: nine existing database entities; `Models/Enums/` includes persisted status constants and derived `AvailabilityStatuses`.
- `Data/`: EF Core mappings to existing columns, no auto-migrate.

## Availability time semantics
Venue `operating_hours`/slot_minutes determine same-day wall-clock slots; timezone (default Asia/Manila) converts each to UTC; slots overlapping active `court_schedule_entries` are resolved by blocked > occupied > pending. Started slots are elapsed; future open slots within minimum-notice/advance rules are available. Invalid/ambiguous DST boundaries are skipped rather than guessed. PostgreSQL `tstzrange` uses half-open intervals so adjacent slots can coexist. A held row with expired `expires_at` still blocks until status changes to EXPIRED.

## Pricing semantics
Rule filters: nullable court/date weekday (0=Sun), time ranges, active flag; precedence court-specific then priority DESC then ID DESC. Split slots at matching rule boundaries, prorate per minute, round at end. Falls back to court base rate. Quote is **estimated under current rules**, not a booking guarantee, and can change before a Phase 5 transactional booking.

## Security and boundaries
Admin rule changes require OWNER/MANAGER session and CSRF from Phase 3. Public endpoints expose only availability and prices, not customer/booking data. Authentication and client-frontend pages remain outside Phase 4. Phase 5 revalidates availability/pricing inside a transaction and relies on PostgreSQL exclusion constraints for final conflict prevention.

See [Phase 4 specifications](../phase-4-availability-pricing.md), [migration safeguards](../database-migrations.md) and progress.md.

## Phase 5 transaction and guest security

- `Services/Bookings/BookingService.cs`: create/lookup/cancel/confirm and staff calendar read. Validates a contiguous range of 1–8 slots, recalculates quote inside a transaction, expires overdue rows with the canonical SQL function, saves HELD schedule + booking atomically, and catches SQLSTATE 23P01/23505.
- `Background/PendingBookingExpiryWorker.cs`: runs SQL `expire_pending_schedule_entries()` every 30s; stale HELD/AWAITING_REVIEW entries remain occupied until their persisted status changes.
- `Security/GuestBookingTokens.cs`: **Booking:SigningKey** (per-venue persistent 32+-byte secret from user-secrets/env), purpose-separated HMAC for deterministic idempotency booking code and bearer guest token. Never expose the key. Changing key invalidates existing tokens.
- `Controllers/Public/BookingsController.cs`: rate-limited booking creation, guest lookup/cancellation with `X-Booking-Token`, no-store responses. No customer data in public availability.
- `Controllers/Admin/BookingsController.cs`: staff list, manager/owner confirm or cancel with existing staff cookie and CSRF.
- `Repositories/`: existing booking and schedule repositories and EF Core unit-of-work, with complex atomic status transitions via EF `ExecuteUpdateAsync`. All writes use the SQL-first schema.

See [Phase 5 operator guide](../phase-5-booking-engine.md). There is no payment flow, admin interface, or guest booking frontend in this phase.

## Phase 6 payment and staff operations

- `Services/Payments/PaymentService.cs` + `Repositories/Payments/`: guest proof submission, manual staff payment entries, verification/rejection, payment balances and external refund records. Payment + booking state changes serialize through a locked `court_schedule_entries` row and persist in one transaction.
- `Storage/IProofStorage.cs`, `LocalProofStorage.cs`: private filesystem storage, random non-user filenames, header checks and 5 MiB upload cap. Requires `ProofStorage:Directory` outside public wwwroot. No public file routes; protected admin image preview/PDF attachment only.
- `Services/Operations/OperationsService.cs`: confirmed staff/manual bookings and future maintenance BLOCKED entries with SQL overlap protection. All channels are stored as a structured notes prefix because `bookings.booking_source` does not yet exist.
- `Controllers/Public/PaymentsController.cs`: token-authenticated guest receipt upload/status.
- `Controllers/Admin/PaymentsController.cs`: protected proof access, review, manual record and external refund logging.
- `Controllers/Admin/OperationsController.cs`: walk-in/phone/Messenger bookings and court blocks; existing Phase 3 cookie+CSRF rules apply.

The canonical nine-table SQL bootstrap remains unchanged. A future reviewed migration should add a true booking_source field and potentially an auditable payment-action history. Phase 6 provides manual verification only: no settlement API, no actual refund payments, no automated invoices or SMS.

## Phase 7 Next.js player web

- app/page.tsx: server-side venue branding and live player availability UI.
- app/booking/[code]/page.tsx: private guest status, payment proof and eligible hold cancellation.
- app/find-booking/page.tsx: booking reference and optional venue-provided access token input.
- components/booking/: dynamic grid, contact/hold, payment file preview, booking status/recovery.
- lib/player.ts: pure client-safe date, price, slot-range and brand/contrast helpers.
- lib/server-api.ts: private server-only API_BASE_URL and public venue retrieval.
- app/api/player/[...segments]/route.ts: **explicitly allowlisted same-origin gateway**; it calls only public .NET booking/venue/availability/payment endpoints, never admin API. It stores HMAC guest bearer token in a Secure (production), HttpOnly, SameSite=Lax cookie instead of exposing it to frontend JavaScript. State-changing requests verify Origin; APP_ORIGIN is required on production deployment. All dynamic responses use no-store.

Browser does not compute authoritative prices or confirm payment. File uploads remain server-validated in Phase 6. No cross-device recovery for online bookings: the returned token is intentionally never exposed to client JS or URL; venue-provided tokens can be entered through an optional private recovery form. See [Phase 7 runbook](../phase-7-player-frontend.md).

The frontend is not a venue marketplace. Each deployment uses its own branding, API origin, data and secrets.
