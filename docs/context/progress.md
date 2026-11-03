# Progress and verification

Last updated: 2026-11-03

## Branch state
- [x] Phase 1–2 code present on main.
- [x] PRs #3/#4/#5 were merged into parent *feature branches*, NOT all into main.
- [x] Phase 6 source is in PR #6 targeting the Phase 5 branch; PR #6 open at Phase 7 start.
- [x] Phase 7 branches from feature/phase-6-payments-operations and targets that branch in its own stacked PR.
- [ ] After local verification, integrate the complete Phase 3–7 chain into main through an explicitly reviewed PR. Avoid mistaking earlier merged feature PRs for a merge to main.

## Phase 7 — implemented in GitHub source
- [x] Public Next.js venue-specific homepage with server-fetched venue name, logo, colors, currency/timezone, and offline/non-bookable fallback.
- [x] Interactive grid with courts as columns, time slots as rows, dynamic court counts and horizontal scrolling on mobile.
- [x] Text/color availability statuses: AVAILABLE, OCCUPIED, PENDING, ELAPSED, BLOCKED, UNAVAILABLE; disabled unavailable buttons.
- [x] Native date navigation with server-defined slots/prices; one-to-eight consecutive slot selection and total.
- [x] Contact/booking form with UUID v4 idempotency reuse for unchanged retries, server-authoritative validation and conflict/error feedback.
- [x] Private /booking/{code} route with HELD/AWAITING_REVIEW/CONFIRMED/EXPIRED/CANCELLED/COMPLETED statuses, deadlines and eligible cancellation.
- [x] GCash/bank-transfer proof uploader with local image preview, file metadata, 5 MiB client limit, server validation and manual review messaging.
- [x] Payment history and verified total, separate /find-booking route with optional venue-provided token recovery.
- [x] Server-only, explicit-allowlist Next.js API gateway; HttpOnly per-booking token cookie, CSRF Origin checks on mutating routes, no-store responses.
- [x] Scoped player UI design tokens, contrast-aware venue brand colors, semantic independent status palette, keyboard/screen-reader labels and reduced-motion CSS.
- [x] Node-based unit test source for pure date/slot/brand helpers; npm run check includes tests.
- [x] README, AGENTS.md, docs/context, development guide and Phase 7 operator document updated.
- [x] No SQL-first schema, Docker, .env credentials, user payment data, or backend migration modified.

## Not yet verified / launch blockers
- [ ] Local npm install, npm run check, npm run build, browser responsive audit (320/375/768/1024px) and browser accessibility testing.
- [ ] Full workflow against disposable local PostgreSQL: availability → hold → receipt → manual payment review → confirmation, cancel/expire, race/conflict handling.
- [ ] Existing backend .NET build and local DB verification remain pending across prior phases.
- [ ] Production HTTPS, APP_ORIGIN, stable Booking:SigningKey, durable private proof storage, anti-malware scanning and data backup.
- [ ] No venue-approved payment recipient/instructions in API; **must obtain legitimate instructions before real customer launch**.
- [ ] Online cross-device recovery not implemented; same-device HttpOnly cookie works, optional venue-provided bearer token entry exists.
- [ ] frontend/package-lock.json still needs generation/commit after first real npm install (do not invent a lock file).
- [ ] UI UX Pro Max / Impeccable global skills were not executed via GitHub connector; local skill-led final design/accessibility audit pending.

## Next phases
- [ ] Phase 8 owner/staff dashboard: secure login, courts/hours/pricing, payment approval and preview, manual bookings and blocks.
- [ ] Phase 9 full E2E/accessibility/security/performance checks and independent venue deployment.

**Phase 7 source implemented ≠ built/tested/deployed.** Do not touch initialized PostgreSQL volumes or run an unreviewed EF migration.
