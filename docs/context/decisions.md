# Decision log

Last reviewed: 2026-11-03

| ID | Decision | Status |
| --- | --- | --- |
| D-001 | Dedicated branded app + independent database per venue, shared implementation | Confirmed |
| D-002 | Court list/time grid, not a floor plan | Confirmed |
| D-003 | Green available, red occupied, gray elapsed, yellow pending; distinct blocked/unavailable | Confirmed |
| D-004 | .NET 10 API + Next.js 16/TypeScript/Tailwind monorepo | Phase 1 |
| D-005 | PostgreSQL 17 Docker/DBeaver SQL-first nine-table schema | Confirmed |
| D-006 | Track `AGENTS.md` and docs/context wiki in Git | Confirmed |
| D-007 | UI UX Pro Max first, Impeccable audit/polish | Confirmed |
| D-008 | Keep one API project with layered folders until separation justified | Confirmed |
| D-009 | Existing SQL + safe EF Core mappings; no unreviewed initial migrations | Phase 2 |
| D-010 | Staff cookie/CSRF; CLI owner bootstrap; OWNER/MANAGER/STAFF role-based CRUD | Phase 3 |
| D-011 | Availability slots generated from operating hours, not persisted as empty DB rows | Phase 4 source |
| D-012 | Active holds remain PENDING despite past expiry timestamp until DB status transitions to EXPIRED | Safety rule |
| D-013 | Price rules: court-specific > venue-wide, higher priority > newer ID, prorate partial windows | Phase 4 source |
| D-014 | All displayed quotes server-computed; final booking prices revalidated in Phase 5 | Mandatory |
| D-015 | Skip invalid/ambiguous DST local slots rather than guess offsets | Phase 4 conservative behavior |
| D-016 | Pricing rule deactivation rather than deletion; OWNER/MANAGER edits, STAFF reads | Phase 4 source |

Documentation records decisions, not proof of a passing local build.
