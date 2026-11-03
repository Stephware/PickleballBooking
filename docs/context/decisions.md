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

| D-017 | Book 1–8 complete consecutive venue slots as one atomic schedule entry/booking | Phase 5 implementation |
| D-018 | Generate idempotent PB- booking codes from UUID v4 + persistent per-venue HMAC secret; same intent retries | Phase 5 implementation |
| D-019 | Guest lookup/cancel requires signed X-Booking-Token, never code-only | Phase 5 security rule |
| D-020 | HELD hold duration uses venue settings, capped at booking start; expiry worker runs every ~30s plus transactional expiry | Phase 5 implementation |
| D-021 | Customer may cancel HELD/AWAITING_REVIEW before start; confirmed reservations require staff for cancellation | Phase 5 provisional policy |
| D-022 | Payments/deposits deferred to Phase 6; Phase 5 snapshots required_deposit=0 | Explicitly limited MVP |

| D-023 | Manual proof review for GCash/bank; online booking confirmed only after owner/manager full-payment verification | Phase 6 |
| D-024 | Store proofs in private persistent server path; image inline for staff, PDF attachment; maximum 5 MiB | Phase 6 |
| D-025 | Refund endpoint records externally completed refund only; does not transmit funds | Phase 6 |
| D-026 | Staff manual bookings start CONFIRMED; record WALK_IN/PHONE/MESSENGER in notes until approved booking_source migration | Phase 6 limitation |
| D-027 | OWNER/MANAGER manage maintenance blocks, STAFF can create manual bookings/payments, payment approvals Owner/Manager only | Phase 6 |
| D-028 | No manual book or block may overlap an active schedule entry; PostgreSQL exclusion remains final guard | Phase 6 |
| D-029 | Bank/GCash receipts require a reference; verification serializes identical references to prevent duplicate approvals | Phase 6 |

| D-030 | Player frontend uses courts-as-columns/time-as-rows, horizontally scrollable on mobile; no floor-plan UI | Phase 7 |
| D-031 | Venue brand colors scoped to deployment with contrast-aware text; status colors stay semantic | Phase 7 |
| D-032 | Store HMAC guest token in Next.js HttpOnly SameSite cookie, never JS/localStorage/query URL | Phase 7 security |
| D-033 | Next.js API gateway allowlists public backend routes; Origin validated for POST; production APP_ORIGIN required | Phase 7 security |
| D-034 | Guest receipt input previews locally, but confirmed status only after authorized Phase 6 payment review | Phase 7 |
| D-035 | No invented GCash/bank recipient instructions; add official venue-approved details before public launch | Launch blocker |
| D-036 | Cross-device recovery for online holds unavailable until a secure verified channel is designed | Documented limitation |

| D-037 | Separate staff workspace at /admin, not mixed with public player booking site | Phase 8 |
| D-038 | Next.js BFF owns staff transport: ASP.NET Core staff+CSRF cookies stay in HttpOnly SameSite=Strict frontend cookies | Phase 8 security |
| D-039 | Authenticate with anonymous CSRF then re-issue authenticated CSRF token; validate exact Origin on mutations | Phase 8 security |
| D-040 | Restrict BFF to explicit method/path allowlist, never generic proxy; .NET remains role authority | Phase 8 security |
| D-041 | Payment proof images only via staff-authenticated no-store route; PDFs downloaded; no public storage | Phase 8 |
| D-042 | Admin shared design tokens with Phase 7; staff rights view-only for manager/owner actions | Phase 8 |
| D-043 | Financial review requires human verification; manual recording/refund does not send money | Phase 8 |

Documentation records decisions, not proof of a passing local build.
