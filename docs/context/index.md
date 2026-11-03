# Project wiki — selective context index

Read this index first, then only task-relevant pages. Current C# code and PostgreSQL SQL establish implemented behavior; documents record decisions and verification status.

| Document | Read for |
| --- | --- |
| [requirements.md](requirements.md) | Product scope |
| [ui-ux.md](ui-ux.md) | UI UX Pro Max + Impeccable and schedule UI |
| [architecture.md](architecture.md) | API/DB layers and Phase 4 engine |
| [workflows.md](workflows.md) | Booking, holds, pricing status flows |
| [decisions.md](decisions.md) | Architectural choices and rule precedence |
| [progress.md](progress.md) | Phase source completion vs runtime verification |
| [log.md](log.md) | Short implementation change history |
| [../phase-3-authentication.md](../phase-3-authentication.md) | Staff auth, cookie, CSRF and venue management |
| [../phase-4-availability-pricing.md](../phase-4-availability-pricing.md) | Slots/statuses, rate rules and new APIs |
| [../phase-5-booking-engine.md](../phase-5-booking-engine.md) | Reservation requests, signed guest access, holds and expiry |
| [../phase-6-payments-operations.md](../phase-6-payments-operations.md) | Proof uploads, staff payment review, bookings and maintenance blocks |
| [../phase-7-player-frontend.md](../phase-7-player-frontend.md) | Player web routes, API gateway, secure guest access and responsive booking UI |
| [../phase-8-owner-staff-dashboard.md](../phase-8-owner-staff-dashboard.md) | Admin login, protected gateway, role-aware operations and UI testing |
| [../database-migrations.md](../database-migrations.md) | Migration safeguards |
| [../phase-9-final-verification.md](../phase-9-final-verification.md) | Original Phase 9 executed verification (historical baseline) |
| [../improvements-phase-1-admin-usability.md](../improvements-phase-1-admin-usability.md) | Post-Phase-9 Phase 1 admin simplification, shared slot picker and walk-in rules |
| [../improvements-phase-2-public-payment.md](../improvements-phase-2-public-payment.md) | Post-Phase-9 Phase 2 public gallery, venue contact, payment instructions and proof previews |
| [../improvements-phase-3-workflow-refinement.md](../improvements-phase-3-workflow-refinement.md) | Post-Phase-9 Phase 3 usability refinement and safety checks |
| [../deployment.md](../deployment.md) | Independent venue containers, trusted ingress and recovery |
| [../development.md](../development.md) | How to run and test |
| [../api/README.md](../api/README.md) | Current endpoints |

## Status — November 3, 2026

- One reusable implementation, separate deployment/database/private storage/keys per venue; canonical nine-table SQL unchanged.
- Phase 9 starts from Phase 8 merge `3b0a67e`. PRs #1–2 merged to main; #3–8 merged to parent feature branches. All implementation commits are included; main integration still requires review/approval.
- Actual .NET, npm, PostgreSQL API, browser and production-container checks have run. See [Phase 9 verification](../phase-9-final-verification.md) for executed counts and coverage, and [deployment guide](../deployment.md) for configuration/backup/rollback.
- Real venue payment instructions, malware controls, actual TLS ingress and operator backup/monitoring acceptance remain launch gates. No production deployment or main merge was performed.

Open only the relevant pages for the task to conserve agent context.

## Post-Phase-9 usability improvement

A separate four-phase UX plan follows original Phase 9. The first phase now implements the five-section owner dashboard and a shared interactive schedule on `feature/phase-1-admin-usability`. Team Accounts/Venue Settings are hidden by default, branding updates require a developer-controlled server flag, and immediate staff-only walk-ins are constrained by a short grace period and database overlap checks. Runtime verification remains pending. See the improvement guide.

## New usability Phase 2 (public/payment)

The `feature/phase-2-public-payment-experience` branch adds a **config-driven** venue court photo carousel, phone/Facebook contacts, approved GCash/bank recipient details with optional QR, and full-size local guest/authenticated staff image proofs. No real venue photos, contact details, bank/GCash recipient or QR have been supplied. Unconfigured public details are intentionally hidden/flagged as unpublished. This phase requires fresh CI/browser verification before integration into main. See [Phase 2 guide](../improvements-phase-2-public-payment.md).

## Post-Phase-9 usability Phase 3

Task-oriented polish for the existing player and owner interfaces: Today quick actions first; a booking-specific inline cancellation confirmation; collapsed payment ledger; race-safe admin loading/retries and no editable opening-hour placeholders on failed load; progressive private-token input, focused booking steps and browser Back/Forward. Read [Phase 3 guide](../improvements-phase-3-workflow-refinement.md). This branch requires its own runtime verification, separate from earlier passing runs.
