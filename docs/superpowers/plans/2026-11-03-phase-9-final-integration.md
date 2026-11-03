# Phase 9 implementation and verification plan

Approved scope: integrate existing Phases 1–8; preserve SQL-first schema, venue isolation, and existing local data. No production deployment or merge to main.

1. Account for branch history. Start Phase 9 from Phase 8 merge `3b0a67e`; verify Phase 3–8 implementation commits are ancestors and record integration base.
2. Establish real .NET and npm baselines, resolve package/build failures, generate the npm lockfile. Run existing and new regression tests after each affected fix.
3. Review backend booking/payment/auth/operations. Reproduce defects before fixes. Exercise real PostgreSQL 17 constraints and service/API state transitions only on disposable `pickleball_phase9_test` at port 55439.
4. Verify frontend gateways, login, reservation/payment workflow and role boundaries against the test backend. Preserve current tokens/layout. Use UI UX Pro Max and Impeccable guidance; inspect rendered 320/375/768/1024px surfaces.
5. Harden production startup/configuration, private storage, trusted reverse proxy and persistent authentication keys. Add portable container/CI configuration and independent-venue deployment, backup/restore and rollback procedures. Test configuration rejection and safe response headers.
6. Run final restore/build/test/check/build, synthetic API/browser/security scenarios; document exact counts, skips and blockers. Update AGENTS and context wiki.
7. Commit and push Phase 9. Open review PR against Phase 8 parent and, only with sufficient verification, a separate integration PR to main. Never merge.

Review focus: concurrency/idempotency, refunded reference reuse, expiry persistence, real antiforgery handshake, customer/proof access, deployed secrets and key durability, mobile navigation and failure states.

Execution: backend and frontend independent reviews delegated; parent owns integration environment, runtime/deployment configuration, documentation and final reconciliation. User explicitly requested execution without unnecessary confirmation.
