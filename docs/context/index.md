# Project wiki — selective context index

Read this index first, then only task-relevant pages. Current C# code and PostgreSQL SQL establish implemented behavior; documents record decisions and verification status.

| Document | Read for |
| --- | --- |
| [requirements.md](requirements.md) | Product scope |
| [ui-ux.md](ui-ux.md) | UI UX Pro Max + Impeccable and schedule UI |
| [architecture.md](architecture.md) | API/DB layers and Phase 4 engine |
| [workflows.md](workflows.md) | Booking, holds, pricing status flows |
| [decisions.md](decisions.md) | Architectural choices and rule precedence |
| [progress.md](progress.md) | Phase source completion vs runtime verification |
| [log.md](log.md) | Short implementation change history |
| [../phase-3-authentication.md](../phase-3-authentication.md) | Staff auth, cookie, CSRF and venue management |
| [../phase-4-availability-pricing.md](../phase-4-availability-pricing.md) | Slots/statuses, rate rules and new APIs |
| [../phase-5-booking-engine.md](../phase-5-booking-engine.md) | Reservation requests, signed guest access, holds and expiry |
| [../phase-6-payments-operations.md](../phase-6-payments-operations.md) | Proof uploads, staff payment review, bookings and maintenance blocks |
| [../phase-7-player-frontend.md](../phase-7-player-frontend.md) | Player web routes, API gateway, secure guest access and responsive booking UI |
| [../database-migrations.md](../database-migrations.md) | Migration safeguards |
| [../development.md](../development.md) | How to run and test |
| [../api/README.md](../api/README.md) | Current endpoints |

## Status — November 3, 2026

- One venue per deployment and database; shared codebase; nine SQL-first PostgreSQL tables remain unchanged.
- Phase 1–2 code is on main. PR #3 merged to the Phase 2 branch, and PR #4 merged to the Phase 3 branch; main remains behind Phases 3–4.
- Phase 5 provides booking/hold API, signed guest access and expiry worker. Phase 6 provides manual payment proof/review, staff bookings, block management and external refund records on top of it. No database schema changes.
- Phase 7 implements the customer-facing booking, payment-proof preview and status source on a stacked branch, including server-only API gateway and helper tests. **No verified production frontend build or rendered UX audit yet.**
- .NET builds, live PostgreSQL booking/payment tests and comprehensive E2E remain unverified. Automated settlement and **staff/owner frontend UI** remain unimplemented.

Open only the relevant pages for the task to conserve agent context.
