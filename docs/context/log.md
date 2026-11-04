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

## 2026-11-03 — Post-Phase-9 usability Phase 2

Added real-asset-only, developer-configured court photo slider, optional venue phone/Facebook links, approved GCash/bank recipient/QR instructions with fail-closed unconfigured state, enlarged guest/staff proof image previews and local pre-upload PDF inspection. Added top back controls, styling, pure config tests and browser harness updates; no SQL/backend/Compose/credentials modified. Real venue media and production recipient details remain operator-provided; CI/run verification must be recorded separately.

- **Phase 2 CI (historical):** [Run 41584555464](https://github.com/Stephware/PickleballBooking/actions/runs/41584555464) passed 107 .NET, 28 frontend, 29 HTTP scenarios and sampled browser/Axe checks. Operator/venue acceptance remained outstanding.

## 2026-11-03 — Post-Phase-9 usability Phase 3

Refined existing customer/admin flows: front-loaded Today quick actions, proper per-booking cancellation reason and explicit destructive confirmation, collapsed advanced payment ledger, race-safe async loading and payment selection, retry-only hours on failed load, role-aware actions, admin Back/Forward history, progressive guest access token, keyboard-focused guided forms, top Back and mobile styles. Added browser smoke regression coverage. No backend/SQL schema/proof storage/Compose changes. CI and physical-device verification are separate.

- **Phase 3 CI (historical):** [Run 41587873946](https://github.com/Stephware/PickleballBooking/actions/runs/41587873946) passed 107 .NET, 28 frontend, 29 API scenarios, Next.js and Playwright/Axe; merged implementation via PR #14.

## 2026-11-03 — Post-Phase-9 usability Phase 4

Added isolated production-image Compose CI (test-only override and guarded runner script), persistence tests for staff/guest tickets and private PNG/PDF receipts across container replacement, database dump/restore to separate synthetic database, and developer venue customization gate checks. Production launch blocked pending physical-device, real payment, malware scanning, TLS/ingress and encrypted off-site recovery acceptance. No production database, real credentials, live deployment or migrations were changed. Results require GitHub CI execution.

- **2026-11-03 — Phase 4 final CI:** Runs [41593785871](https://github.com/Stephware/PickleballBooking/actions/runs/41593785871) and [41593785968](https://github.com/Stephware/PickleballBooking/actions/runs/41593785968) passed on commit `291e453`. 107 .NET tests, 28 Node tests, 29 API scenarios, Playwright/Axe; isolated production containers survived recreate with cookies/proofs intact and restored PostgreSQL accepted adjacent/rejected overlapping active intervals. Public launch remains NO-GO pending human operator gates.


## 2026-11-03 — Pickleball Reserve identity

Imported the venue-supplied logo and four real indoor-court photographs from historical Phase 9, integrated the approved burgundy/cream system-wide look on a main-based feature branch, and added a custom paddle/ball hero graphic over a real court photograph. Redesigned landing/header/gallery and branded owner workflows while preserving server-authoritative booking, payment and authorization logic. Configuration tests and documentation added; no database schema, stored user data, secrets or backend behavior changed. CI and physical device acceptance remain pending; no main merge or deployment performed.

## 2026-11-03 — Payment review policy correction

Default proof submission window changed to 10 minutes. Accepted proof
creates non-expiring `AWAITING_REVIEW` reservations to protect paying guests
from staff inactivity, and restores late manual verification. A guarded
forward-only SQL patch updates the existing schema check/expiry function,
preserving stored payment evidence and the court-overlap exclusion. Staff
urgency alerts and explicit cancellation reason implemented. No production
database, credentials or actual transfers touched; fresh CI and operator
migration still required.


## 2026-11-04 — Correct venue display identity

Corrected the supplied Reserve-branded frontend from legacy generic names to
**Pickleball Reserve** in public navigation, owner/admin and metadata. The
per-venue API branding opt-out remains unchanged. Added new-install SQL
bootstrap identity and a separate guarded existing-DB data-only update script.
Did not change booking/payment logic, court schedule, credentials, database
schema, existing venue slugs or production data. Verification via PR CI.
