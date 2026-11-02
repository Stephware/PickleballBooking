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
| [../database-migrations.md](../database-migrations.md) | Migration safeguards |
| [../development.md](../development.md) | How to run and test |
| [../api/README.md](../api/README.md) | Current endpoints |

## Status — November 3, 2026

- One venue per deployment and database; shared codebase; nine SQL-first PostgreSQL tables remain unchanged.
- Phase 1 merged; Phase 2 and 3 open stacked PRs at Phase 4 start.
- Phase 4 adds server-side dynamic availability and pricing rule management; includes tests but needs local .NET build/database verification.
- **No booking creation, payment or customer/admin frontend flows implemented yet.**

Open only the relevant pages for the task to conserve agent context.
