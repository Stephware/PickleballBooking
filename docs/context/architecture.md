# Architecture and data model

One reusable deployment/codebase, separately configured PostgreSQL database per pickleball venue. The original SQL-first nine-table schema remains the source of truth. No schema changes are made in Phase 4.

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
Admin rule changes require OWNER/MANAGER session and CSRF from Phase 3. Public endpoints expose only availability and prices, not customer/booking data. Authentication and client-frontend pages remain outside Phase 4. Phase 5 must revalidate availability and pricing under transaction and rely on PostgreSQL exclusion constraints to eliminate booking races.

See [Phase 4 specifications](../phase-4-availability-pricing.md), [migration safeguards](../database-migrations.md) and progress.md.
