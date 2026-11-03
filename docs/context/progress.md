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
- [x] **GitHub Actions passed** [run 41584555464](https://github.com/Stephware/PickleballBooking/actions/runs/41584555464) on source commit c389e94: **107 .NET tests, 28 frontend Node tests, 29 live API scenarios**; lint, TypeScript, Next.js production build, runtime audit and disposable-venue browser/axe workflow all passed. No browser runtime errors.

Earlier Phase 9 and usability Phase 1 passing runs do not establish Phase 2 validation. See [Phase 2 guide](../improvements-phase-2-public-payment.md).
