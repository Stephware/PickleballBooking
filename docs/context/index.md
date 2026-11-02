# Project wiki — selective context index

Read this index first, then only the pages relevant to the task. The code and SQL are the source of truth for implemented behavior; these pages record decisions, product requirements, and progress.

| Page | Read for |
| --- | --- |
| [requirements.md](requirements.md) | Approved scope and proposed player/owner features |
| [ui-ux.md](ui-ux.md) | UI UX Pro Max + Impeccable workflow, booking status colors, accessibility |
| [architecture.md](architecture.md) | Components, deployment isolation, database model |
| [workflows.md](workflows.md) | Booking, payments, time-slot generation and staff actions |
| [decisions.md](decisions.md) | Approved choices vs assumptions |
| [progress.md](progress.md) | Implemented, tested, pending |
| [log.md](log.md) | Short change history |

**Source of truth:** current user decisions > actual repository code/SQL for behavior > documented intent > assumptions. Never claim a planned feature is already working.

## Snapshot — 2026-11-02

- Individually branded booking systems for individual venues, built on one reusable codebase and one PostgreSQL schema; separate deployment and database per venue.
- List or time-grid of courts (not a venue floor plan), variable court count.
- Semantic court statuses: available, occupied, elapsed; pending and blocked/closed as additional states.
- User reported Docker/PostgreSQL/DBeaver connection working on Mac. No local DB restart or migration is needed to set up this repository.
- Minimal .NET 10 health API scaffold; functional booking endpoints and Next.js screens not yet built.

## Efficient task routing

- Booking tasks → requirements, workflows, actual schema.
- Backend/data tasks → architecture, progress, project and SQL.
- Frontend/branding tasks → ui-ux, requirements, decisions, and actual design tokens/components.
- Planning/reporting → decisions, progress; record meaningful changes in log.
