# Wiki change log

- **2026-11-02 — Starter:** PostgreSQL/Docker schema, API scaffold, context wiki, AGENTS.md.
- **2026-11-02 — UI/UX:** UI UX Pro Max and Impeccable development guidance added.
- **2026-11-03 — Phase 1:** API foundation, tests, Next.js starter, CORS and status.
- **2026-11-03 — Phase 2:** SQL-first EF mapping, repositories, health/db and opt-in tests; PR #2, not merged at Phase 4 start.
- **2026-11-03 — Phase 3:** Cookie/CSRF staff authentication, venue/courts/hours APIs, staff management; stacked PR #3.
- **2026-11-03 — Phase 4:** Availability grid/status engine, timezone-local slots, batched active schedule queries, pricing rules and prorated calculator, quote + admin endpoints, unit/integration test source; stacked on Phase 3. DB unchanged. Local build and DB verification still pending.

- **2026-11-03 — Phase 5:** Added transactional guest bookings/holds with deterministic HMAC idempotency, guest access tokens, staff confirmation/cancellation, automatic SQL hold expiry, rate limits, tests and operator guide. Branched from Phase 4. No PostgreSQL schema or Docker changes. Build/live DB verification pending.
