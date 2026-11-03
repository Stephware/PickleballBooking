# Progress and verification

Last updated: 2026-11-03 (Asia/Manila).

## Implemented

- Phases 1–8 source integrated on `feature/phase-9-final-integration` from Phase 8 merge 3b0a67e. Main remains at the Phase 1–2 integration until approved merge.
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

- Main merge requires approval: review PR #9 and draft main integration PR #10 are open and unmerged. Remote CI run 41561368392 passed all implementation checks for 784cb5d, including Linux browser/Axe.
- **Public launch blocked:** official payment recipient instructions, malware controls, actual TLS/DNS/certificate/CDN trust configuration and operator backup/retention/monitoring acceptance.
- Physical touch devices, live screen readers, production load and actual external payment reconciliation are not verified.
- Cross-device verified guest recovery, automated settlement/refund transfers and normalized booking-source reporting remain deferred.
- Sixteen moderate development-tool advisories remain; no runtime dependency vulnerabilities reported. Existing xUnit cancellation analyzer warnings remain on clean compilation.

See [Phase 9 final verification](../phase-9-final-verification.md) for coverage/limits, [development](../development.md) for reproduction and [deployment](../deployment.md) for operation/rollback. Existing local venue database/data/credentials were not reset or reseeded.
