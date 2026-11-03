# Phase 8 — owner and staff dashboard

The Next.js administration dashboard lives at **/admin**, separately from the public player website. It reuses existing Phase 3–6 ASP.NET Core staff and operational APIs. No new SQL migration, Docker change, payment gateway or bank integration is included.

## Screens and role permissions

| Screen | STAFF | MANAGER | OWNER |
| --- | --- | --- | --- |
| Login/logout and own password | Yes | Yes | Yes |
| Overview and reservation list | View | View, confirm and cancel | View, confirm and cancel |
| Pending payments and private proof preview | View | Approve/reject | Approve/reject |
| Staff-recorded cash/GCash/bank payment | Yes | Yes | Yes |
| External refund record | No | Yes | Yes |
| Manual WALK_IN/PHONE/MESSENGER booking | Yes | Yes | Yes |
| Court blocks | View | Create/remove | Create/remove |
| Courts and pricing rules | View | Create/edit/deactivate | Create/edit/deactivate |
| Operating hours | View | Edit | Edit |
| Venue branding, currency and policies | View | View | Edit |
| Team accounts | No | No | Create, activate, reset |

The backend authorizes every operation independently of the UI. The Owner account remains created through the one-time CLI bootstrap; no new public sign-up.

## Security: server-side staff proxy

- frontend/app/api/admin/session/route.ts implements GET session, POST login, DELETE logout.
- frontend/app/api/admin/[...segments]/route.ts forwards only method/path pairs in frontend/lib/admin-policy.ts. This is not a generic proxy. Every call maps to /api/v1/admin on the configured ASP.NET Core API.
- Login first fetches an anonymous backend CSRF cookie and request token, calls the existing protected .NET login endpoint, receives a signed/encrypted backend staff cookie, then fetches a **new CSRF token bound to the signed-in identity**.
- Next.js stores the backend staff cookie, backend antiforgery cookie and authenticated request token in separate **HttpOnly, SameSite=Strict** browser cookies scoped to /api/admin, with **Secure** in production and 8-hour maximum age. Never store them in client JavaScript, localStorage, query strings or analytics.
- All backend staff mutations are executed on the Next.js server with both backend cookies and X-CSRF-TOKEN. Frontend mutations also require a matching Origin. Production must set APP_ORIGIN to its exact HTTPS public origin or mutations fail closed.
- Backend staff identity, active state, role and password fingerprint are revalidated on every request. Role-specific UI controls are not a replacement for backend enforcement.
- Private receipt images are returned only through /api/admin/payments/{id}/proof for authenticated staff. The gateway limits MIME and bytes, sets no-store and nosniff, and downloads PDF attachments rather than embedding untrusted PDFs inline. No payment file becomes a public static asset.
- Session logout and password changes clear the frontend's staff cookies. Production needs stable ASP.NET Core Data Protection keys across API replicas.

## Operations

**Overview:** today's confirmed booking count, pending proof count, active courts, unconfirmed holds and quick links. Metrics are operational snapshots, not accounting or lifetime revenue.

**Bookings:** venue-local date and status filtering, guest contact, court, duration, price, owner/manager confirm and cancel. Cancellation does not send a refund.

**Payments:** pending submission queue, receipt preview alongside amount/reference, approve/reject with a confirmation, review notes, per-booking payment ledger and verified balance. STAFF may record externally received cash or transfer claims; MANAGER/OWNER may approve and record already-executed external refund references. This system does not move money or verify bank funds automatically.

**Manual booking:** select an active court and adjacent available future slots; enter name/contact, WALK_IN/PHONE/MESSENGER channel, optional notes. Existing backend creates one confirmed booking with PostgreSQL overlap exclusion. Guest token is displayed privately to the staff member once for secure handoff.

**Maintenance:** create/view/remove court blocks. Existing bookings are never overwritten.

**Management:** court name/rate/order/active flag; pricing priority, court/day/time, rule editing and deactivation; seven-day opening hours; owner-only venue brand/timezone/booking policies; owner-only staff creation, activation and password resets.

## User experience

The admin UI reuses Phase 7 brand variables, typography and accessible status language. Desktop uses an orderly left navigation and task-specific content; mobile uses a collapsible sidebar. Every action has a nearby label, validation and feedback, and sensitive cancellation/payment approvals require confirmation. New rate fields start blank rather than making users erase 0.00. All data and proof files are private.

Globally installed UI UX Pro Max and Impeccable skills were not executable through the GitHub connector. Their **actual browser/mobile/accessibility audit** remains a developer-local verification step, not a completed test.

## Run locally

Start the existing API and PostgreSQL, with private ConnectionStrings:Pickleball, Booking:SigningKey and ProofStorage:Directory, plus a CLI-bootstrapped Owner:

    dotnet run --project backend/Pickleball.Api

Then in the frontend folder:

    cp .env.example .env.local
    npm install
    npm run check
    npm run build
    npm run dev

In frontend/.env.local:

    API_BASE_URL=http://localhost:5090
    APP_ORIGIN=http://localhost:3000

Visit http://localhost:3000/admin. For real deployment, APP_ORIGIN must use the public HTTPS origin. Commit frontend/package-lock.json after the first real npm install, and use npm ci thereafter. Never commit passwords, tokens or receipt files.

## Runtime verification still required

- npm install, npm run check (including admin allowlist tests), npm run build.
- Login/CSRF/signout/password change with real ASP.NET Core auth; inspect HttpOnly, SameSite and Secure cookies.
- Staff-role 403 restrictions, Owner/Manager approvals, disabled-user logout and expired sessions.
- Private image preview and PDF attachment, and anonymous denial (401).
- Confirmed booking and cancellation, manual booking overlaps, blocks, court/pricing/venue/hours persistence.
- Real payment review against test receipts, partial external payment claim, recorded external refund (no actual transfer).
- Responsive 320/375/768/1024px keyboard, screen reader, contrast, reduced-motion and failure-state audit.
- Use disposable PostgreSQL test data; do not modify or reset the user's working Docker volume.

Phase 8 has source changes only until runtime checks complete. Phase 9 remains end-to-end testing, security hardening, observability and independent venue deployment.

## Post-Phase-9 admin usability changes (new Phase 1)

The Phase 8 menu/role matrix above documents the **original** implementation. The new approved routine interface is five sections: Today, Schedule, Payments, Manage and My Account. Team Accounts and Venue Settings are hidden from regular navigation, but the underlying staff role APIs remain for future venues. Branding and global venue policy edits now require an explicit server-controlled opt-in, off by default, and OWNER authorization. Operators retain control of courts, hours and pricing.

Schedule combines reservations, Add Booking and Block Court. A shared visual picker shows a court-by-time grid on desktop and large per-court time slots on phones. WALK_IN may select a staff-only WALK_IN_NOW current slot within a short server-enforced grace window if there is no active schedule overlap; the public API and blocks remain strict. Top back controls are used for detail steps.

These changes are recorded in [Phase 1 usability guide](improvements-phase-1-admin-usability.md) and **require fresh build, disposable database, browser and accessibility verification**; earlier Phase 9 results were run before these improvements.
