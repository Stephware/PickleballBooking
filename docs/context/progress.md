# Progress and verification

Last updated: 2026-11-03

## Branch state
- [x] Phases 1–2 on main.
- [x] PRs #3–#5 closed against their **parent feature branches**, not merged to main.
- [x] PR #7 closed/merged against Phase 6 parent feature branch at Phase 8 start.
- [x] Phase 8 code built on feature/phase-7-player-frontend as a stacked feature branch.
- [ ] Integrate Phases 3–8 all the way into main **after** successful runtime tests and integrated code review.

## Phase 8 source work
- [x] New /admin page, staff login/logout and role-aware dashboard navigation.
- [x] Server-side ASP.NET Core staff auth handshake: anonymous CSRF → login → authenticated CSRF.
- [x] Admin HttpOnly + SameSite=Strict staff/antiforgery cookies, production Secure, origin checks and backend-forwarded CSRF on mutations.
- [x] Explicit method/path admin allowlist; route-policy Node test source. No arbitrary admin path or public API proxy.
- [x] Non-cacheable, authenticated private image-proof previews and PDF download path.
- [x] Today's overview, bookings date/status list, owner/manager confirm/cancel.
- [x] Pending payment reviews, amount/reference/proof side-by-side, approve/reject, review notes, record received payments, external refund references.
- [x] Walk-in/phone/Messenger reservations, court blocks, courts CRUD, pricing rule CRUD/deactivation, operating hours, venue branding/policy and owner-only staff account management.
- [x] Own-password change and sign-out, plus mobile/desktop admin CSS using Phase 7 visual tokens.
- [x] docs/phase-8-owner-staff-dashboard.md, AGENTS.md, selective context wiki and frontend developer notes updated.
- [x] No backend C#, SQL schema, Docker compose, data, secrets or upload files changed.

## Known limitations / verification required
- [ ] npm install / npm run check / npm run build and real Next.js smoke run.
- [ ] ASP.NET Core .NET restore/build/test and disposable PostgreSQL E2E across Phases 3–8.
- [ ] Real browser authentication/cookie/CSRF/role verification, origin failure, staff deactivation, authenticated proof preview.
- [ ] Admin UI rendered responsiveness, keyboard, screen-reader and color contrast audit at 320/375/768/1024px; run globally installed UI UX Pro Max + Impeccable locally.
- [ ] Confirm actual venue-approved payment instructions, official recipient, and safe production receipt storage before customer launch.
- [ ] No automated bank/GCash settlement/refund, no guest verified cross-device recovery, and manual booking channel lacks normalized booking_source DB field.
- [ ] frontend/package-lock.json must be generated and tracked after real npm install; never fabricate it.

## Next
- [ ] Phase 9: comprehensive builds, end-to-end concurrency/security/accessibility testing, backups, deployment hardening and independent venue deployment.

**Source present ≠ runtime-verified.** Preserve the existing PostgreSQL data and Docker volume; no unreviewed migrations or resets.
