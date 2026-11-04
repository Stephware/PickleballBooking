# Progress and verification

Last updated: 2026-11-03 (Asia/Manila).

## Implemented

- Phases 1–9 source was integrated into `main` after the Phase 9 review. The historical verification below describes that prior implementation, not newer usability changes.
- Player booking/proof/status UI and separate role-aware staff dashboard, original SQL-first nine tables, transactional holds/expiry, manual verification and staff operations.
- Phase 9 fixes payment reference/history, final-total rounding, build/test configuration, streamed BFF limits, trusted proxy/rate buckets, security headers, mobile keyboard behavior and contrast.
- Real npm lockfile; non-root images, independent-venue Compose/configuration, least-privilege runtime role, guarded API/browser harnesses and CI definition.

## Executed locally

- .NET restore/build passed. Final full suite: **102 passed / 0 failed / 0 skipped** with disposable PostgreSQL; offline **88 passed / 14 skipped**, including an explicit invalid ambient-connection safety run.
- Frontend check clean: **18 Node tests passed**, lint/types passed; standalone production build passed; runtime dependency audit **0 vulnerabilities**.
- HTTP real API workflow: **29 checks passed / 0 failed** with repeatable synthetic fixtures.
- Browser **79 checks passed** (76 layouts + 3 workflows), 0 runtime errors; sampled Axe checks 0 violations. Widths 320/375/768/1024; actual 3-court flows plus explicit read-only count/error fixtures.
- Remote GitHub Actions run [41561368392](https://github.com/Stephware/PickleballBooking/actions/runs/41561368392) passed end-to-end on implementation commit 784cb5d.
- Both container images built; production-image deployment **7 checks passed**, including per-client throttling and surviving staff/guest/proof access after application recreation.
- Synthetic PostgreSQL dump restored into a different test database: nine tables, exclusion constraint and sample records verified.

## Pending / blocked

- The original Phase 9 implementation was reviewed/landed in main. Its GitHub Actions run 41561368392 passed all implementation checks for 784cb5d, including Linux browser/Axe.
- **Public launch blocked:** official payment recipient instructions, malware controls, actual TLS/DNS/certificate/CDN trust configuration and operator backup/retention/monitoring acceptance.
- Physical touch devices, live screen readers, production load and actual external payment reconciliation are not verified.
- Cross-device verified guest recovery, automated settlement/refund transfers and normalized booking-source reporting remain deferred.
- Sixteen moderate development-tool advisories remain; no runtime dependency vulnerabilities reported. Existing xUnit cancellation analyzer warnings remain on clean compilation.

See [Phase 9 final verification](../phase-9-final-verification.md) for coverage/limits, [development](../development.md) for reproduction and [deployment](../deployment.md) for operation/rollback. Existing local venue database/data/credentials were not reset or reseeded.

## Post-Phase-9 usability improvements — Phase 1 (new, unverified)

- [x] Five-item operator navigation: Today, Schedule, Payments, Manage, My Account.
- [x] Shared court-by-time picker, responsive court tabs, 1–8 adjacent slots, guided Add Booking / Block Court.
- [x] Booking source WALK_IN / PHONE / MESSENGER retained; block history/removal retained.
- [x] Staff-only immediate walk-in grace: half configured slot length up to 30 min, no active persisted overlap, transaction revalidation and GiST exclusion.
- [x] Team Accounts and Venue Settings hidden from regular UI; existing roles/staff APIs preserved. Venue branding write is developer-config-gated and disabled by default.
- [x] Mobile reservation cards, payment-detail navigation, top back controls, focused Today metrics; test source and docs.
- [x] No SQL-first schema migrations, Docker volume changes, or committed credentials.
- [ ] **New changes not yet runtime verified**: .NET 10 build/test, Next.js lint/types/Node tests/build, browser mobile/a11y, live disposable PostgreSQL concurrency and walk-in flows.
- [ ] No physical-device/screen-reader test in this GitHub-only authoring session.
- [ ] Remaining agreed usability phases: public site/photos/payment instructions, payment UX refinements and final usability audit.

Read [Phase 1 usability implementation](../improvements-phase-1-admin-usability.md). The earlier Phase 9 test counts above are historical and must not be reused as validation for this new branch.

## Post-Phase-9 usability improvements — Phase 2 (new branch)

- [x] Phase 1 approved changes merged into `main` through PR #11; current Phase 2 branches from that integration.
- [x] Developer-curated photo carousel with swipe, scroll snap, previous/next controls and no autoplay; existing illustration when photos not configured.
- [x] Optional validated phone and Facebook/Messenger contact links.
- [x] Payment instructions gated by explicit operator approval and completeness; GCash, bank and optional QR, no invented accounts. Recipient details are public only when approved.
- [x] Full-size guest image preview and local PDF open before submission; existing file validations preserved.
- [x] Private staff image enlargement and protected PDF download fallback; existing role/CSRF/private proof gateway retained.
- [x] Top back control on guest booking details and booking status, responsive styles.
- [x] Pure validator tests, existing Playwright receipt preview assertions updated, operator docs and environment example.
- [x] No backend C#, SQL-first schema, booking/payment status, or Docker volume changes.
- [ ] **Actual real court photos, phone/Facebook handles, GCash/bank recipient/QR not supplied**; must come from the venue and be approved before production usage.
- [ ] Actual phone, QR, PDF and photo carousel checks with real media and physical touch devices remain pending.
- [x] Phase 2 GitHub Actions [run 41584555464](https://github.com/Stephware/PickleballBooking/actions/runs/41584555464) passed: 107 .NET tests, 28 frontend Node tests, 29 live API scenarios, production build and browser/Axe checks. Phase 2 merged into main via PR #12.

Earlier Phase 9 and usability Phase 1 passing runs do not establish Phase 2 validation. See [Phase 2 guide](../improvements-phase-2-public-payment.md).

## Post-Phase-9 usability Phase 3 — workflow refinement (merged into main via PR #14)

- [x] Today quick actions moved above KPIs; unauthorized staff don't see Block Court quick action.
- [x] Booking-specific inline cancellation editor (reason attached to the correct booking), deliberate final confirmation; status-filter empty state can be cleared in one tap.
- [x] Payment ledger/history collapsed by default; selected proof-detail race protection and retryable queue errors.
- [x] Admin resource request-hook ignores stale results, with consistent loading/retry messages.
- [x] Opening Hours cannot save fabricated fallback days when GET fails.
- [x] Player booking details receive reliable heading focus, no timer-dependent scroll; correct step label.
- [x] Optional cross-device booking token behind accessible disclosure; top back control and removed redundant reload.
- [x] Admin browser Back/Forward works for five top-level sections; staff-only actions remain role-restricted.
- [x] Responsive inline cancellation and advanced ledger styling; browser smoke assertions updated.
- [x] Phase 3 GitHub Actions run [41587873946](https://github.com/Stephware/PickleballBooking/actions/runs/41587873946) passed: 107 .NET, 28 frontend, 29 API scenarios, Next.js and Playwright/Axe. Merged via PR #14.
- [ ] Physical-phone, real screen reader, flaky network and rapid payment selection manual checks; final UX Phase 4.
- [x] No backend/database schema, Docker, secret or payment state-machine changes.

Detailed design and validation: [Phase 3 guide](../improvements-phase-3-workflow-refinement.md).

## Post-Phase-9 usability Phase 4 — final release audit

- [x] Added a *separate* isolated production Docker Compose regression workflow for app code/deployment/script PRs and explicit manual dispatch.
- [x] CI-only test overlay uses distinct `pickleball_release_test` with explicit disposable project guard and isolated seeded OWNER/courts; never uses an existing database or persistent venue volume.
- [x] Checks production image builds, public/private routing, Secure/HttpOnly staff/guest cookies, CSRF/origin/rate limit, locked owner venue settings, staff-only schedule, private PNG and downloadable PDF.
- [x] Recreates only test API/frontend containers and checks existing signed session/guest/proof access across restarts.
- [x] Dumps only the test DB and restores to a **different** test DB, checking nine tables, bookings, payments, GiST exclusion constraint.
- [x] Documents explicit operator go/no-go and unresolved launch gates.
- [ ] **Current Phase 4 workflow results to be recorded after GitHub CI executes**; do not reuse Phase 2/3 test counts.
- [ ] No real iPhone/Android device, live screen reader or real bank/GCash settlement, real venue asset, live TLS/DNS or off-site encrypted restore signoff in this phase.
- [ ] Actual public launch remains blocked until human/venue acceptance gates in [Phase 4 guide](../improvements-phase-4-final-verification.md) are completed.

No production volumes, venue database data or real secrets were touched.

## Post-Phase-9 usability Phase 4 — final release verification

- [x] PR #16 adds a dedicated disposable production-image Docker Compose CI release check; main production schema, environment and Docker volumes remain unchanged.
- [x] Synthetic production gateway/session/origin/CSRF/rate limiting, guest token and private PNG/PDF access, and owner venue customization default-off checks.
- [x] Persistence tested after API/frontend container recreation using isolated named proof/keys/database volumes.
- [x] Database dump restored into a **different disposable test database**, including 9 tables, 4 bookings, 4 payments and working GiST exclusion.
- [x] Actual conflicting active schedule insertion rejected; adjacent half-open slot insertion accepted then rolled back.
- [x] [Integrated workflow 41593785871](https://github.com/Stephware/PickleballBooking/actions/runs/41593785871) **PASSED** on `291e453`: 107 C# tests, 28 frontend tests, 29 HTTP scenarios, Next.js build and Playwright/Axe, zero browser runtime errors.
- [x] [Production release workflow 41593785968](https://github.com/Stephware/PickleballBooking/actions/runs/41593785968) **PASSED** on `291e453`: nine pre-restart and ten post-restart deployment scenarios plus restored DB overlap constraint.
- [ ] **Public launch: NO-GO** until venue payment recipient/QR/photo/contact approval, proof malware/retention, live TLS/DNS, physical-device and screen-reader, backup/restore, monitoring and rollback signoff.
- [ ] Merge PR #16 only after final review; a passing synthetic CI is not permission to deploy.

See [Phase 4 release verification](../improvements-phase-4-final-verification.md) for evidence and blocked gates.


## Pickleball Reserve design integration — review branch (2026-11-03)

- [x] Preserved current main implementation and imported five brand assets from the old Phase 9 feature branch into the dedicated visual branch.
- [x] Applied burgundy/cream branding, navigation, real court-photo showcase, paddle-and-ball hero and responsive owner/player UI.
- [x] Existing court schedule, real payment statuses, private tokens, owner roles, no-fake-contact safeguard and backend booking/payment/SQL logic were retained.
- [x] Added theme configuration unit tests, documented photo defaults and corrected green AVAILABLE visual statuses.
- [ ] Fresh GitHub Actions CI, mobile/desktop browser screenshots and keyboard/a11y regression testing still required.
- [ ] Public venue launch still NO-GO pending official payment details, operator security and physical-device acceptance.


## 2026-11-03 — Simplified hero and mobile booking (review branch)

- [x] Remove cartoon paddle/ball SVG from the player hero and redundant feature strip; keep the approved real court photography.
- [x] Fix phone schedule CSS selector to hide duplicate desktop table under 681px, retaining the live court/time cards, selection summary and booking form.
- [x] Extend browser smoke checks for exclusive phone/desktop layouts across 1, 3, 8 and 12 courts.
- [ ] Verify this branch's GitHub CI and fresh phone browser/a11y results before merging.

## Protected payment review and 10-minute proof policy — 2026-11-03

- [x] Reduced default HELD proof deadline from 15 to 10 minutes (still capped at game start); old-default venue rows can be upgraded by forward-only SQL.
- [x] Removed automatic expiry for payment-submitted `AWAITING_REVIEW`; active GiST exclusion continues reserving the court.
- [x] Staff can verify valid transfers after the game start; explicit reason needed for management cancellation of a pending review.
- [x] Guest copy, owner configuration, and staff queue notifications updated; legacy review-timeout control removed.
- [x] Added forward-only idempotent existing-DB patch and disposable migration verification step.
- [ ] Fresh branch CI, browser, and live deployment upgrade acceptance must be verified.
- [ ] Real venue database migration must be applied by an authorized operator after consistent backup; **not performed from GitHub**.


## Pickleball Reserve official name — 2026-11-04

- [x] Set the bundled theme's venue display name to **Pickleball Reserve** for all public/staff pages.
- [x] Derive browser metadata from the resolved venue, respecting independent API-branded deployments.
- [x] Update default SQL bootstrap for a brand-new Pickleball Reserve instance; leave all booking references and existing venue slugs unchanged.
- [x] Add opt-in, guarded existing-database rename script and branding unit tests.
- [ ] Apply the data-only name patch to the real Reserve venue database only after an operator confirms its target and backup. Source merge does not edit the live database.


## Court name/ordering fix — 2026-11-04

- [x] Remove misleading generated court numbering from management cards.
- [x] Remove court display-order editor and API contract field; use ascending court IDs for all server listings.
- [x] Show actual saved names in desktop schedule headings without additional prefix.
- [x] Add API, disposable-database and browser regression coverage for stable ordering and exact names.
- [ ] Check fresh CI before merging; no real venue data updated.


## Venue branding library — 2026-11-04

- [x] Added five named venue themes and scoped, reuse-the-layout colorways.
- [x] Added five developer-upload media folders (logo, hero, courts); copied Reserve originals into its catalog without changing legacy paths.
- [x] Added conventional filenames for automatic image discovery on new themes and neutral fallbacks for missing assets.
- [x] Kept venue template selection frontend-only; no database, auth, payments or tenant isolation changed.
- [ ] Verify browser and CI for current branch; never deploy prospect templates against shared real customer data.
