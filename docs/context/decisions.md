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
| D-021 | Guest cancels unstarted pending bookings only when no submitted/verified payment exists; staff handles financial cancellations | Implemented/tested Phase 9 |
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

| D-044 | Integrate the complete Phase 3–8 implementation chain through Phase 9, review before merging main | User-authorized; main merge pending |
| D-045 | Preserve SQL-first schema; all mutation tests use explicitly opted-in disposable `_test` databases | Implemented/tested |
| D-046 | Preserve original verification metadata; refunded references cannot be verified again elsewhere | Implemented/tested |
| D-047 | Stable per-venue signing/Data Protection keys and private proof volumes survive container replacement | Implemented/tested in disposable production-image stack |
| D-048 | Trust configured ingress/BFF hops explicitly; public origin controls upstream scheme; one validated client IP preserves throttling | Implemented/tested; real ingress acceptance pending |
| D-049 | Use supported Webpack production build after local Turbopack socket-binding failure | Verified .NET/Next local environment |
| D-050 | Public launch needs official payment instructions, malware controls and operator TLS/backups/monitoring acceptance | Open launch gates; no production deployment authorized |

| D-051 | Round the exact full reservation total once; displayed rounded slot estimates are not authoritative totals | Phase 9 correctness fix; guest/manual persistence regression tested |

| D-052 | Post-Phase-9 improvements: five regular operator sections, one OWNER default; retain independent staff APIs/roles for future venues | Phase 1 source |
| D-053 | Hide Venue Settings / Team Accounts in normal admin; developer-only configuration flag defaults off for venue brand/policy PUT | Phase 1 source |
| D-054 | Share live staff visual schedule for booking and court blocks, mobile tabs, max 8 consecutive slots; backend revalidates | Phase 1 source |
| D-055 | WALK_IN alone permits current elapsed slot during min(half slot,30m) grace after active schedule check and transactional revalidation | Phase 1 source |
| D-056 | Keep top back controls and mobile labeled reservation cards; prefer operational tasks over administrative complexity | Phase 1 source |

| D-057 | Gallery uses manually deployed real venue raster photos, max six, no autoplay or owner uploads, illustration fallback if empty | Post-Phase-9 usability Phase 2 |
| D-058 | Phone/Facebook contact strictly validated and optional, one per-venue developer config | Post-Phase-9 usability Phase 2 |
| D-059 | Publish GCash/bank destination only on explicit developer-verified approval gate and complete account fields; no sample recipients | Security / usability Phase 2 |
| D-060 | Guest local receipt image may enlarge with modal; locally opened PDF before upload; no public proof storage | Phase 2 |
| D-061 | Staff receipt remains private authenticated preview with larger modal; PDF still attachment, not inline | Phase 2 |
