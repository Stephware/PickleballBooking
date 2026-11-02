# Progress and verification

Last updated: 2026-11-03

## GitHub branch state
- [x] Phase 1 and Phase 2 code present on main.
- [x] PR #3 merged to the **Phase 2 feature branch**, NOT to main.
- [x] PR #4 merged to the **Phase 3 feature branch**, NOT to main.
- [x] Phase 5 branches from `feature/phase-4-availability-pricing` (contains all Phases 1–4). It is NOT independently present on main.
- [ ] Integration PR/merge needed to carry Phase 3, 4, and 5 commits all the way to main in order, after checks.

## Phase 5 — implemented in source
- [x] Guest booking request and response DTOs with idempotency UUID, contact, court and local start/end.
- [x] Server-side 1–8 consecutive aligned slot validation, dynamic venue hours/notice/horizon/pricing check.
- [x] Transactional insert of HELD schedule entry and booking snapshot, SQL-side overlap exclusion (23P01) and duplicate key (23505) conflict handling.
- [x] Persistent per-venue HMAC signing key, deterministic booking codes for idempotent retries, bearer guest access tokens.
- [x] Authenticated guest lookup and cancellation via `X-Booking-Token`; 404 for bad credentials.
- [x] Staff daily booking list, atomic confirm and cancel endpoints; OWNER/MANAGER authorization and CSRF for mutations.
- [x] 30-second periodic SQL expiry worker plus immediate expiry transition during booking state changes.
- [x] Guest IP-rate limiting, private/no-store responses, and existing Phase 3 CORS protections.
- [x] Unit/integration test source for tokens, auth boundaries and PostgreSQL GiST overlap constraint.
- [x] No modifications to existing SQL schema, Compose configuration, migration baseline or Docker volume.
- [x] Updated AGENTS.md and tracked Karpathy context wiki.

## Verification not yet completed
- [ ] `dotnet restore/build/test` on a .NET 10-enabled machine.
- [ ] Real PostgreSQL /health/db with developer-side user-secrets.
- [ ] Booking HMAC secret configured through secure persistent environment/user-secrets.
- [ ] Test create / identical retry / overlapping reservation / expiration / guest cancellation / staff confirmation and cancellation on a disposable development DB.
- [ ] Test concurrent independent requests against the exclusion constraint under actual PostgreSQL.
- [ ] Code review of security, production HTTPS, reverse-proxy IP rate limiting and deployment key persistence.
- [ ] Frontend `package-lock.json` generated and committed after local install.

## Deferred
- [ ] Phase 6: payment proof, approval and walk-in/phone/Messenger reservations.
- [ ] Phase 7: player booking UI; Phase 8: staff dashboard.
- [ ] Phase 9: comprehensive E2E/security and independent venue deployment.

**Source implementation is not runtime verification.** Preserve your existing SQL-first database; do not call `dotnet ef database update` or reset Docker volumes.
