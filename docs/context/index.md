# Project wiki — selective context index

Read this index first, then open only relevant topic pages. Current code and canonical SQL define reality; this wiki records decisions and verification status.

| Document | Load for |
| --- | --- |
| [requirements.md](requirements.md) | Project scope |
| [ui-ux.md](ui-ux.md) | UI UX Pro Max + Impeccable practices |
| [architecture.md](architecture.md) | API/DB architecture, roles, per-venue isolation |
| [workflows.md](workflows.md) | Availability and booking flows |
| [decisions.md](decisions.md) | Approved architectural choices |
| [progress.md](progress.md) | Implementation vs verified progress |
| [log.md](log.md) | Changes |
| [../phase-3-authentication.md](../phase-3-authentication.md) | Cookie login, CSRF, bootstrap, roles and Phase 3 API |
| [../development.md](../development.md) | Local setup |
| [../database-migrations.md](../database-migrations.md) | SQL-first migration safeguards |
| [../api/README.md](../api/README.md) | Actual endpoint list |

## Status — 2026-11-03

- Branded single-venue applications using the same code and a distinct database per client.
- Phase 1 merged; Phase 2 EF mapping remains under PR #2 at Phase 3 start.
- Phase 3 provides source for staff auth, Owner/Manager/Staff roles, venue settings, hours and court management. No migration or Docker operations. Source build and live integration tests still pending.
- Booking availability, time-slot engine, reservation/payment flows and real frontend/admin remain unimplemented.

Read architecture and phase-3-authentication for API tasks; UI/UX and requirements for frontend work; progress to avoid false completion claims.
