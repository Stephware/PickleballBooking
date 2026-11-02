# Decision log

Last reviewed: 2026-11-03

| ID | Decision | Status |
| --- | --- | --- |
| D-001 | One dedicated branded system per venue, shared code/schema, separate DB | Confirmed |
| D-002 | Court list/time-grid rather than venue floor-layout image | Confirmed |
| D-003 | Available/occupied/elapsed status colors | Confirmed |
| D-004 | Pending hold and blocked/closed status treatment | Recommended |
| D-005 | PostgreSQL 17 in Docker; DBeaver management | Confirmed; user reports working |
| D-006 | ASP.NET Core .NET 10 + Next.js TypeScript monorepo | Selected direction |
| D-007 | Track docs/context wiki and root AGENTS.md in Git | Confirmed |
| D-008 | UI UX Pro Max for design direction; Impeccable for audits/polish | Confirmed |
| D-009 | Temporary holds, owner payment approval, staff dashboard/manual bookings | MVP proposal |
| D-010 | One API project with layer-based folders initially; avoid premature Core/Infrastructure splitting | Implemented |
| D-011 | Next.js 16 App Router + TypeScript + Tailwind 4 starter | Implemented, not booking UI |
| D-012 | xUnit v3 and WebApplicationFactory tests | Implemented; runtime unverified |
| D-013 | EF Core 10 + Npgsql 10 mappings to existing SQL schema; status strings and PostgreSQL-specific SQL stay canonical | Phase 2 implementation |
| D-014 | Do not auto-create/migrate/reset existing DB; future baseline migration requires generated snapshot and DB-clone review | Phase 2 safeguard |
| D-015 | Use user-secrets/env for `ConnectionStrings:Pickleball` and expose separate `/health/db` | Phase 2 implementation |

Code and SQL take priority when reporting what is really implemented.
