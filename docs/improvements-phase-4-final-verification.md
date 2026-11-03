# Post-Phase-9 improvements — Phase 4: Final testing and verification

**Scope:** Final integration/regression review for the original nine development phases and approved usability phases 1–3. Source work on `feature/phase-4-final-release-verification` from `main`. This is an **acceptance and safety phase**, not a new product feature or permission to deploy to customers.

## What is automatically verified

### Application and workflow CI (existing)

`.github/workflows/verify.yml` runs with a disposable PostgreSQL 17 database, synthetic OWNER, .NET 10, Node 22, a production Next.js build and isolated Chrome/Axe:
- C# build, unit/integration tests, staff CSRF/role authorization, pricing/availability/overlap, reservation holds, expiry, guest tokens, payment submissions/reconciliation, court maintenance and staff walk-ins.
- Frontend lint, TypeScript, Node tests and runtime dependency audit.
- HTTP booking/payment concurrency and cancellation workflows against a synthetic database.
- Browser 320px, 375px, 768px and 1024px; guest booking/payment receipt image and private staff review; simplified admin navigation, top Back controls, keyboard focus, misleading empty states, and retryable hours.

### Disposable production-image / release check (new)

`.github/workflows/release-verify.yml` runs **only for repo code/deployment/script PRs or explicit manual dispatch**, and calls `scripts/phase4-verify-release.sh`. It never takes a venue URL, production env file, existing Docker project, existing DB or real payment account. Guards require:

- GitHub Actions context, explicit test opt-in, this GitHub run's unique `pickleball_phase4_<run-id>_test` project, `pickleball_release_test` database, `https://phase4-ci.example.test` origin and known synthetic credentials.
- The project must start without existing named database/proof/key volumes; scripts refuse to reuse them.
- Only a fresh Compose test override `deployment/phase4-ci.compose.yaml` points PostgreSQL/API at the disposable `_test` database.
- The canonical SQL schema is applied **only to the brand-new test DB**; `scripts/seed-test.sql` itself rejects non-`_test` databases.
- Separate production frontend/API Docker images and a least-privileged runtime PostgreSQL role; one synthetic OWNER bootstrapped once. The real owner/staff setup and admin interface are not modified.
- Synthetic full paid-booking route: BFF origin and rate-limit boundaries, Secure/HttpOnly cookies, CSRF, private booking token, staff proof read, anonymous proof denial, separate PDF attachment (never inline), default-disabled owner branding edits, and staff-only schedule access.
- Container recreation with the **same isolated named DB/key/proof volumes**, then revalidates the first staff session, guest access and both private PNG/PDF receipts.
- `pg_dump` of `pickleball_release_test`, restore to a different `pickleball_restored_test`, then check the nine tables, bookings, payments and PostgreSQL GiST exclusion constraints.
- A cleanup trap tears down **only the uniquely scoped disposable CI project and its test volumes**. No external venue system is deployed or mutated.

This is stronger than a static checklist, but it is still synthetic and does **not** confirm a real domain, real payment settlement, genuine malware scanning, off-host backup reliability or real player devices.

## Production go/no-go criteria

| Gate | Automated evidence | Human/venue obligation | Status |
| --- | --- | --- | --- |
| .NET/Next.js build, unit and integration suites | Both CI workflows passed on `291e453` | Review changes after any subsequent merge | **Automated PASS; venue signoff pending** |
| Database exclusion / no double booking, holds, cancellations | Disposable restored DB actively accepts adjacent and rejects overlapping active slots | Run an owner-controlled real schedule walkthrough | **Automated PASS; venue signoff pending** |
| Secure owner login, roles, CSRF, private guest tokens | Production-image synthetic tests passed for cookies/CSRF/origin/private proofs and persistence after restart | Keep bootstrap/recovery credentials private; confirm single OWNER access | **Automated PASS; venue signoff pending** |
| Public GCash/bank instructions | Config validator requires complete explicitly approved recipient fields | Verify real payee name, number and QR independently; set approval flag only afterward | **BLOCKED until venue supplies details** |
| Manual receipt approval and actual refunds | Synthetic receipts, private PNG/PDF, manual verification status | Verify bank/GCash transactions out-of-band; handle refunds outside the app | **Not automatically verified** |
| Untrusted uploaded files | MIME signature and 5 MiB limit tests; private proof storage | Provide **malware scanning/quarantine** and a retention/deletion policy | **BLOCKED** |
| Venue photos and contacts | Developer-only config validation; no fake media | Obtain image rights, real venue phone/Facebook, optimize/remove EXIF, approve images | **BLOCKED until provided** |
| Mobile / accessibility | Responsive 320/375/768/1024px Playwright/Axe sample | Test physical iOS/Android touch, actual screen reader and slow network with venue staff | **PENDING** |
| Public ingress | Synthetic HTTPS-origin forwarding + trusted peer checks | Configure and verify live DNS, TLS, proxy chain, rate-limit client IP, firewall | **BLOCKED** |
| Backups and operational recovery | Test disposable PostgreSQL dump→separate restore and container-key/proof persistence | Encrypted scheduled off-site DB + proof + key backups; recovery drill and RPO/RTO signoff | **BLOCKED** |
| Monitoring & maintenance | Build and health tests | Production logs/alerts, disk/backup age, secrets rotation, incident owner and rollback test | **BLOCKED** |

**GO only when:** Both CI workflows pass at the reviewed release commit, no new critical or high findings remain, and every human/venue acceptance gate has been explicitly completed. Automated tests alone never authorize public launch.

## Reproduction

The regular tests live in `.github/workflows/verify.yml` and [development guide](development.md).

The production-style test has two separate files:

- `deployment/phase4-ci.compose.yaml` overrides only the test database name/connection.
- `scripts/phase4-verify-release.sh` refuses to run outside its GitHub Actions disposable context.

Run the new GitHub workflow by opening a PR that changes code/deployment/scripts, or using **Actions → Verify isolated production release → Run workflow** on an appropriate branch. Observe both the normal `verify` and isolated `disposable-compose` job. Do not copy the CI credentials, `_test` overlay or CI volume-cleanup commands into production operations.

For an actual venue, follow [deployment.md](deployment.md), use independent secrets/storage/hostnames, and **never** reset/seed/reapply the schema to an existing live database. Phase 4 does not create any EF migrations or Docker volume reset for production.

## Remaining manual verification

Before accepting an actual venue, record evidence for:
1. Real phone testing at least one iPhone/Safari and Android/Chrome (320–430 px, landscape and keyboard), and actual keyboard/screen-reader walk-through.
2. The guest entire flow from real phone through hold, published official GCash/bank instructions, genuine receipt, manually checked external payment, and confirmed reservation without double booking.
3. Owner operations from a phone: Add Booking by Walk-in/Phone/Messenger, current-slot walk-in grace/denial, Block Court, cancellation and separate refund.
4. Approved photos/contact channels, real QR number/payee matching, correct date/timezone, pricing, customer privacy and venue branding.
5. Malware/quarantine and proof retention, trusted HTTPS ingress, encrypted off-host backups/restore, monitoring and rollout/rollback.

Do not mark these items passed based on synthetic fixtures or screenshots. No production financial transaction, real customer account or venue database is touched by Phase 4.

## Executed Phase 4 verification — November 3, 2026

The final reviewed implementation commit `291e453303e4ee29a837fdd71718ca2a2cbe0895`
passed **both** GitHub Actions workflows:

- [Verify integrated venue application — run 41593785871](https://github.com/Stephware/PickleballBooking/actions/runs/41593785871): .NET 10 restore/build, **107 C# tests**, frontend lint/typecheck/**28 Node tests**, Next.js standalone production build, clean production-only dependency audit, **29 live API scenarios**, and Playwright/sampled Axe across 320/375/768/1024px with no browser runtime errors.
- [Verify isolated production release — run 41593785968](https://github.com/Stephware/PickleballBooking/actions/runs/41593785968): production API/frontend images, isolated disposable PostgreSQL and least-privilege app account, **9 initial + 10 after-restart deployment scenarios** passed, signed session and private PNG/PDF proof persistence after container recreation, fresh PostgreSQL dump and restore (nine tables, four bookings, four payments, one GiST exclusion).
- The restored database was **actively challenged** inside a rolled-back transaction: an adjacent half-open schedule entry was accepted, while an overlapping active entry raised PostgreSQL's `exclusion_violation`. Merely checking the presence of the constraint is not treated as enough.

Earlier CI attempts surfaced and resolved the test SQL delimiter issue; only the successful
**final** SHA is cited as verification. The CI deliberately used synthetic data and
disposed of its own uniquely scoped containers/volumes. No real venue database
was accessed or modified.

**Release verdict: NO-GO for public venue deployment.** The automated implementation
and regression gates passed, but venue/operator gates remain incomplete:
actual verified GCash/bank/QR/phone/Facebook details and approved court media,
malware scanning and retention for uploaded proofs, physical iOS/Android
and screen-reader tests, real trusted HTTPS/DNS setup, encrypted off-site backup
and recovery drill, and monitoring/incident/rollback signoff. These cannot be
claimed complete from synthetic CI.
