# Phase 9 — final integration and verification

Verification date: **2026-11-03 (Asia/Manila)**. This report distinguishes implemented code, executed checks and operator acceptance. No production deployment or merge to main is authorized by this work.

## Overall status

**Implemented and locally verified:** Phases 1–8 integrated with Phase 9 correctness/security/UI fixes, real dependency lockfile, regression/integration/browser harnesses, CI definition and independently configured container deployment artifacts. Canonical SQL-first nine-table schema is unchanged. Existing PostgreSQL containers, databases, volumes and local credentials were not reset or reseeded.

**Public deployment is blocked pending operator acceptance:** official venue payment instructions, malware controls for public uploads, real TLS ingress/DNS/certificates, off-site backups/restore objectives, retention and monitoring. Passing disposable local tests is not production certification.

## Git accounting

GitHub was checked live, rather than using the Phase 8 opening snapshot:

| PR | Actual state | Base |
| --- | --- | --- |
| #1 foundation | Merged | main |
| #2 database mappings | Merged | main |
| #3 auth/venue/courts | Merged | feature/phase-2-database-integration |
| #4 availability/pricing | Merged | feature/phase-3-staff-venue-courts |
| #5 booking engine | Merged | feature/phase-4-availability-pricing |
| #6 payments/operations | Merged | feature/phase-5-booking-engine |
| #7 player frontend | Merged | feature/phase-6-payments-operations |
| #8 admin frontend | Merged | feature/phase-7-player-frontend |

Phase 9 branches from **3b0a67e**, the Phase 8 merge into the Phase 7 branch; main is **0a3aeba** at integration start. The implementation chain includes 671bcad, d5b75b8/5beea53, 3261205, 1834b4e, 1e2569d and 93136af. No cherry-pick duplication, force-push, history rewrite or main merge was needed. Review PR [#9](https://github.com/Stephware/PickleballBooking/pull/9) targets the Phase 8 parent; draft integration PR [#10](https://github.com/Stephware/PickleballBooking/pull/10) targets main. Neither is merged. Phase 1–2 standalone implementation documents were not present; their actual code, SQL, tests, development and migration guides were reviewed alongside all existing Phase 3–8 documents.

## Executed checks

| Check | Actual result |
| --- | --- |
| dotnet restore PickleballBooking.slnx | Passed |
| dotnet build PickleballBooking.slnx | Passed; final incremental build 0 warnings/0 errors; clean compilation emits existing xUnit1051 cancellation warnings |
| dotnet test with explicitly enabled disposable PostgreSQL | 102 passed, 0 failed, 0 skipped |
| Default tests without live DB opt-in | 88 passed, 14 genuinely skipped, 0 failed (also verified with an invalid ambient connection) |
| npm install / real package-lock generation | Passed; lockfile committed |
| npm run check | Passed lint/types; 18 Node tests passed, 0 failed |
| npm run build | Passed, Next.js 16.4.3 standalone Webpack build; 9 routes compiled |
| npm audit --omit=dev --audit-level=high | Passed, 0 runtime dependency vulnerabilities |
| HTTP booking/payment/staff integration | 29 passed, 0 failed with repeatable synthetic fixtures |
| Chrome Playwright | 79 checks passed: 76 layout checks plus 3 real workflow checks; 0 browser runtime errors |
| Axe WCAG 2/2.1/2.2 AA rule samples | 0 violations in sampled 375px public/admin/form/status screens after fixes |
| API/frontend Docker image builds | Passed |
| Disposable production Compose stack | Passed; 7 final deployment checks including persisted ticket/guest/proof access after recreation |
| PostgreSQL synthetic dump/restore | Passed: 9 tables, overlap exclusion, venue and payment records restored into a different disposable DB |
| Remote GitHub Actions | [Run 41561368392](https://github.com/Stephware/PickleballBooking/actions/runs/41561368392) passed all steps, including Linux PostgreSQL/API/browser/Axe checks, for implementation commit 784cb5d; subsequent documentation reconciliation changes no application source |

The local SDK is 10.0.400, runtime 10.0.11 and Node 22.23.2. Initial test execution required local IPC/network access outside the restricted sandbox. Local Turbopack build hit socket-binding EPERM; supported Webpack compiled successfully and is the reproducible build script. Remaining Node module-type and upstream tool deprecation notices do not fail checks. Sixteen moderate development-only lint dependency advisories remain; no forced major dependency change was applied.

## Bugs reproduced and fixed

- **EF/test runner incompatibility:** explicit aligned EF Relational 10.0.13 and Microsoft.Testing.Platform selection resolve assembly conflicts and the .NET 10 test invocation failure. Anonymous protected mutation tests now correctly expect authorization failure; actual authenticated missing-CSRF rejection is exercised separately.
- **Duplicate transfer after refund:** reference verification previously ignored REFUNDED rows and legacy surrounding whitespace. Refunded/verified references remain consumed, with advisory-lock serialization retained. Real PostgreSQL regressions reproduced the failures before the fix.
- **Lost financial history:** review/refund actions overwrote notes and refund replaced the original verification actor/time. Notes append and original transaction/verification metadata remain intact. This uses the existing notes column, not a new immutable audit table.
- **Multi-slot rounding:** guest/manual bookings added rounded slot quotes, charging 1.02 instead of 1.01 for two 30-minute slots at 1.01/hour. Exact server amounts stay internal/JSON-excluded; reservation totals round once without extra database queries. Public single-slot quote remains 0.51. Both booking paths have real persistence regressions.
- **Unbounded BFF buffering:** JSON/login/multipart routes trusted Content-Length or counted characters after buffering. Shared streamed byte limits now reject chunked/UTF-8 oversize requests before parsing/buffering the rest.
- **Production antiforgery failure:** production login over the internal HTTP hop returned 500 because the API could not see the real HTTPS scheme. Explicit frontend peer trust plus server-configured public-origin scheme now permits Secure antiforgery without trusting arbitrary client headers.
- **Venue-wide rate bucket:** BFF requests originally shared one source IP. A trusted ingress replaces client-address headers; both gateways forward one validated address, accepted only from the configured BFF peer. Container tests exhaust one client's login bucket while another logs in successfully.
- **Container address collision:** initial Compose dynamic allocation consumed the reserved frontend IP. Dynamic addresses now use the upper /25 while the frontend uses a fixed lower address within a per-venue /24.
- **UI/build defects:** corrected Metadata imports, React hook/lint issues, stale loading controls, mobile hidden-sidebar tab access/focus trap/Escape/return, booking error-summary focus, receipt remove/reselect, and measured brand/footer/step/admin-hint text contrast. Existing design direction remains.
- **Misleading test status:** disabled live tests now report skipped, require explicit opt-in and enforce `_test` database names. Offline HTTP hosts are isolated from ambient developer database settings and do not start the expiry worker.

## Feature coverage and limits

**Tested/pass:** availability/pricing precedence, boundaries, prorating, weekdays/DST/semantic states; PostgreSQL exclusion and explicit expired-status release; server-priced holds, exact/changed idempotency intent and concurrent one-winner booking; guest token access/cancellation restrictions; submitted proof remains unverified; private proof access, invalid upload, approval/duplicate approval, rejection regressions, balance and external refund history; manual reservation and maintenance conflicts/removal; anonymous/STAFF restrictions, real CSRF login handshake, password invalidation/deactivation and eight-hour non-sliding session expiry.

**Real browser/API flow passed:** selected slot → contact validation → temporary hold → same-intent retry after simulated lost response → private cookie/reload → cancellation; a separate hold → PNG preview/remove/reselect → upload → AWAITING_REVIEW → staff private preview/approval → guest CONFIRMED. Staff cookies are Secure/HttpOnly/Strict; guest cookies Secure/HttpOnly/Lax; bearer tokens do not appear in document.cookie or the booking creation JSON. Origin mismatch is rejected, logout clears cookies, and mobile navigation keyboard focus is contained/restored.

**UI boundaries:** 320/375/768/1024px headless Chrome emulation, all 11 admin sections, 1/3/8/12-court and empty/closed/outage states. Three-court booking/payment/authentication used the real backend/disposable DB; large-count/failure-state availability responses were intercepted read-only fixtures. UI UX Pro Max and Impeccable were used; screenshots were viewed locally. Physical touch devices, live screen-reader sessions, other browser engines and exhaustive custom-brand combinations are **not verified**.

Most admin management screens were rendered and accessibility checked. Not every court/rule/hour/branding/staff form mutation was exercised through browser clicks; API/unit coverage and real HTTP operations establish the explicitly listed behaviors. No production load/performance benchmark or actual bank/GCash reconciliation was performed. Tests do not prove external settlement or issue actual refunds.

## Database and security evidence

Only new `pickleball-phase9-test` (PostgreSQL 17, loopback 55439, temporary storage) and `pickleball_phase9_deployment` Compose resources received synthetic writes. No commands targeted existing venue data. Mapping/constraint tests, simultaneous HTTP attempts, expiry function tests and a restored synthetic dump exercised the original schema and GiST constraint; no EF migration/schema recreation was applied to existing data.

Production containers ran non-root, with a separately created runtime DB login limited to SELECT/INSERT/UPDATE/sequence/function access. Owner bootstrap, staff login, guest proof writes and authenticated mutations worked with that role. Recreated API/frontend containers retained authentication keys, guest signing access and private proof content through named volumes. Dump/restore was local and synthetic; off-site backups and a complete real recovery drill remain operator gates.

Private storage checks cover signatures/size/unpredictable names/traversal rejection, protected staff reads and PDF attachment behavior. **Malware scanning is not implemented.** Configure scanning/quarantine/retention before public untrusted uploads. Key files rely on restricted private volumes and host/backup encryption; no automatic at-rest key encryption is claimed. CSP covers framing/base/object restrictions, not a full nonce-based script policy. Trusted TLS ingress was simulated over loopback for container checks; public certificates, DNS and CDN trust chains are unverified.

Independent review found the two production proxy defects above; both were fixed and re-reviewed with no further critical/important findings in that scope. No known critical/high application defect remains from these executed checks; the listed production security/operations acceptance gates remain blockers.

## Deployment and reproduction

See [deployment.md](deployment.md) for per-venue environment, trusted Caddy ingress, least-privilege role, empty-database-only initialization, stable signing/Data Protection keys, persistent private proofs, health checks, structured logs, maintenance-window backups, restore and image rollback. See [development.md](development.md) for guarded HTTP/browser harnesses and `.github/workflows/verify.yml` for CI. Do not deploy to a real venue or merge main without approval.

Evidence files/screenshots, synthetic dumps and session tickets remain outside Git in private temporary directories. No real/production credentials, real guest details, private bearer tokens, payment receipts or database exports are committed. Committed CI/fixture values are explicitly synthetic and disposable.
