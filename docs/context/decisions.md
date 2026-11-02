# Decision log

Last reviewed: 2026-11-02

| ID | Decision | Status |
| --- | --- | --- |
| D-001 | One dedicated branded system per venue, shared code/schema, separate DB | Confirmed |
| D-002 | Court list/time-grid rather than venue floor-layout image | Confirmed |
| D-003 | Available/occupied/elapsed status colors | Confirmed |
| D-004 | Pending hold and blocked/closed status treatment | Recommended |
| D-005 | PostgreSQL 17 in Docker; DBeaver management | Confirmed; user reports working |
| D-006 | ASP.NET Core .NET 10 + Next.js TypeScript monorepo | Selected direction |
| D-007 | Track Karpathy-style docs/context wiki and root AGENTS.md in Git | Confirmed |
| D-008 | UI UX Pro Max for design direction; Impeccable for audit/polish | Confirmed workflow |
| D-009 | Temporary holds, owner payment approval, staff dashboard/manual bookings | MVP proposal, not implemented |

Code and SQL take priority when reporting what is truly implemented. Update this document if product decisions change.

- **D-010 (2026-11-03):** Keep one API project organized by layers initially; add separate Core/Infrastructure projects only if complexity warrants. Implemented in Phase 1.
- **D-011 (2026-11-03):** Next.js 16 App Router + TypeScript + Tailwind 4 starter, with a development-only homepage; no false booking functionality. Implemented in Phase 1.
- **D-012 (2026-11-03):** xUnit v3 + ASP.NET Core WebApplicationFactory tests for API foundation; execution remains unverified until local build.
