# Decision log

Last reviewed: 2026-11-03

| ID | Decision | Status |
| --- | --- | --- |
| D-001 | One branded deployment and database per venue, reusable code/schema | Confirmed |
| D-002 | Court list/time-grid, not a physical floor-layout interface | Confirmed |
| D-003 | Green available, red occupied, gray elapsed; pending/blocked states also shown clearly | Confirmed |
| D-004 | PostgreSQL 17 + DBeaver + Docker | User-reported working |
| D-005 | ASP.NET Core .NET 10, Next.js/TypeScript/Tailwind, one repository | Implemented scaffold |
| D-006 | AGENTS.md and selective docs/context wiki tracked by Git | Implemented |
| D-007 | UI UX Pro Max (design) and Impeccable (audit) | Approved workflow |
| D-008 | One API project organized by layers until separate Core/Infrastructure warranted | Current design |
| D-009 | SQL-first EF Core mappings to existing nine tables | Phase 2 source |
| D-010 | No automatic migrations against initialized database | Mandatory |
| D-011 | Phase 3 uses existing staff_users with PasswordHasher and secure cookie+CSRF, no added auth tables | Phase 3 source |
| D-012 | OWNER bootstrap only via one-time CLI secrets, not anonymous HTTP | Phase 3 source |
| D-013 | OWNER changes venue identity/settings and staff; OWNER/MANAGER edit courts and hours; STAFF read-only | Phase 3 source |
| D-014 | Court deactivation is reversible and blocked if future active reservations exist; never delete booking history | Phase 3 source |
| D-015 | Admin frontend not built until Phase 8; backend auth/CRUD routes implemented first | Phased plan |

Do not confuse planned features with implemented behavior or runtime-verified functionality.
