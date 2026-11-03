# Wiki change log

- **2026-11-02 — Starter:** PostgreSQL/Docker schema, API scaffold, context wiki, AGENTS.md.
- **2026-11-02 — UI/UX:** UI UX Pro Max and Impeccable development guidance added.
- **2026-11-03 — Phase 1:** API foundation, tests, Next.js starter, CORS and status.
- **2026-11-03 — Phase 2:** SQL-first EF mapping, repositories, health/db and opt-in tests; PR #2, not merged at Phase 4 start.
- **2026-11-03 — Phase 3:** Cookie/CSRF staff authentication, venue/courts/hours APIs, staff management; stacked PR #3.
- **2026-11-03 — Phase 4:** Availability grid/status engine, timezone-local slots, batched active schedule queries, pricing rules and prorated calculator, quote + admin endpoints, unit/integration test source; stacked on Phase 3. DB unchanged. Local build and DB verification still pending.

- **2026-11-03 — Phase 5:** Added transactional guest bookings/holds with deterministic HMAC idempotency, guest access tokens, staff confirmation/cancellation, automatic SQL hold expiry, rate limits, tests and operator guide. Branched from Phase 4. No PostgreSQL schema or Docker changes. Build/live DB verification pending.

- **2026-11-03 — Phase 6:** Added private GCash/bank payment proof storage, review/approval/rejection, manual payment/refund recording, confirmed staff bookings, schedule blocks, payment-sensitive booking status guards, API tests, AGENTS/wiki. No DB schema or Docker modifications. Build/live payment verification pending.

- **2026-11-03 — Phase 7:** Branded Next.js player homepage, court/time availability matrix, 1–8-slot selection, booking/contact form, private token-backed booking status, receipt upload/preview, find-booking page, server-only gateway, status and offline UX, design tokens and pure helper tests. Stacked on Phase 6; no DB/backend schema or Docker modifications. Next.js build and live browser audit pending.

- **2026-11-03 — Phase 8:** Added Next.js staff/owner dashboard, BFF admin session/CSRF proxy, role-aware bookings, payment review and private proof preview, manual bookings, blocks, courts/pricing/hours/venue/staff settings and account security. Added admin allowlist tests, UI styles, README/wiki/AGENTS. Backend SQL/Docker untouched. Local npm and database tests pending.

## 2026-11-03 — Phase 9 final integration

Verified GitHub PR #1–8 state and branched from Phase 8 merge 3b0a67e. Executed .NET/npm/PostgreSQL/API/browser/container checks; fixed payment history/reference reuse, reservation rounding, dependency/test runner errors, BFF request limits, production HTTPS/client-IP forwarding and UI accessibility defects. Added lockfile, guarded regression/E2E harnesses, CI and isolated-venue deployment/backup/rollback guide. Canonical schema and existing venue database unchanged. Public launch remains gated on venue payment instructions and production security/operations acceptance; main merge requires approval. See phase-9-final-verification.md for exact executed evidence and remaining limits.

Remote GitHub Actions run 41561368392 passed all steps for implementation 784cb5d, including PostgreSQL, .NET, npm, HTTP and Linux Playwright/Axe checks. Opened Phase 9 review PR #9 and separate draft main integration PR #10; neither merged. Stopped only disposable test containers/processes; original database containers remain running.

## 2026-11-03 — Post-Phase-9 admin usability improvements, Phase 1

Introduced five-item owner navigation, hidden Team/Venue UI, default-off developer venue edit gate, one shared interactive availability picker for manual bookings and maintenance blocks, staff-only immediate walk-in grace with overlap safety, improved mobile reservation and payment-detail layouts, top back buttons, tests and docs. Originated from main. No SQL schema, payment logic, secrets or Docker volume changes. New branch build/live verification pending.
