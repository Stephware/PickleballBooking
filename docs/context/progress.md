# Progress and verification

Last updated: 2026-11-03

## Branch state
- [x] Phase 1–2 source on main.
- [x] PRs #3/#4/#5 were merged to their parent *feature branches*, not main.
- [x] Phase 6 source branches from feature/phase-5-booking-engine.
- [ ] Consolidate Phases 3–6 into main after local verification and careful integrated PR review.

## Phase 6 — implemented as source
- [x] Guest GCash/bank-transfer receipt submission, using multipart proof, private 5 MiB file storage and MIME magic validation.
- [x] Owner/Manager payment verification/rejection with atomic booking status transitions and serialized duplicate-reference checks. Guest HELD -> AWAITING_REVIEW -> CONFIRMED on approval; rejected pending entry becomes EXPIRED.
- [x] Timed review window based on venue review_timeout_hours; existing expiry worker handles stale AWAITING_REVIEW rows.
- [x] Authenticated staff image proof preview (PDF attachment), private storage keys, no public file hosting.
- [x] Staff cash/bank/payment recording; pending queue, per-booking payment status and verified/balance totals.
- [x] Manual external refund-recording endpoint for cancelled bookings; **no actual money transfer**.
- [x] Staff confirmed walk-in, phone and Messenger booking endpoints, sharing Phase 4 availability, prices and PostgreSQL overlap exclusion with online bookings.
- [x] Court maintenance block creation, listing and soft-removal using existing schedule entries; owner/manager authorization and CSRF.
- [x] Phase 5 guest cancellation/confirmation guards updated to account for submitted/verified payment.
- [x] Payments repository, operations/payment services, DTOs, file storage interface/implementation, dependency injection, tests, API docs and tracked AGENTS.md/wiki updates.
- [x] No schema migrations, DB volume modifications or committed credentials/proofs.

## Known limitations
- [ ] **Not runtime verified**: .NET restore/build/test and actual PostgreSQL/payment workflows require local testing.
- [ ] Booking source only encoded as [CHANNEL:*] prefix in notes and staff creator ID, not a dedicated DB field. Add a reviewed migration before claiming strong source reporting.
- [ ] Local private proof files require persistent configured absolute storage path and backup; no anti-malware scanning or object storage connector yet.
- [ ] Payment review is manual; real GCash/bank settlement and external refunds are not automated.
- [ ] Current staff payment recorder ID is not separately persisted by the existing payments schema (reviewer is persisted).
- [ ] Frontend customer payment upload/preview UI and owner admin dashboard not built.
- [ ] Phase 1 frontend package-lock.json not committed until local npm install.

## Next phases
- [ ] Phase 7 branded booking/payment customer frontend.
- [ ] Phase 8 owner/staff operations UI with secure image preview and approval.
- [ ] Phase 9 E2E test, concurrency test, file-storage/backup/security and deployment verification.

**Source implemented does not mean running or verified in production.** Never reset existing Docker PostgreSQL or auto-apply EF migrations.
