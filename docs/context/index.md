# Project wiki — selective context index

Load this index first, then only the task-relevant pages. **Code and SQL** establish what is implemented; documentation captures plans, decisions and verification limits.

| Page | Read for |
| --- | --- |
| [requirements.md](requirements.md) | Venue/product requirements |
| [ui-ux.md](ui-ux.md) | UI UX Pro Max and Impeccable workflow |
| [architecture.md](architecture.md) | API/DB architecture and nine SQL-first entities |
| [workflows.md](workflows.md) | Booking holds, payment review and status flow |
| [decisions.md](decisions.md) | Confirmed choices and planned enhancements |
| [progress.md](progress.md) | Implemented vs local verified |
| [log.md](log.md) | Change history |
| [../development.md](../development.md) | Run API/frontend, configure PostgreSQL safely |
| [../database-migrations.md](../database-migrations.md) | SQL-first EF Core baseline safeguards |
| [../api/README.md](../api/README.md) | API route inventory |

## Status — November 3, 2026

- Each venue uses one deployment and PostgreSQL database, sharing reusable app code and schema.
- UI is a list/time-grid of courts, semantic slot statuses: available, occupied, pending, elapsed and blocked.
- Phase 1 API/Next.js scaffold is merged; actual booking UI is not built.
- Phase 2 adds nine EF Core entities and mappings, context, repositories, safe transaction boundary, and database health checking. **Runtime build and DB connection still require local verification.**
- No EF migrations have been run, no Docker data touched. Schema-first migration baseline must be generated/reviewed later.

## Reading by task

- Backend/EF → architecture, progress, database-migrations, actual C#/SQL
- Booking → workflows, requirements, status SQL, actual C#/SQL
- Frontend → ui-ux, requirements, decisions, current Next.js tokens/components
- Planning/verification → decisions, progress, latest commit or PR diff
