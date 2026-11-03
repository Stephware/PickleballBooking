# Usability improvements — Phase 1: Admin simplification and interactive operations

**Scope:** Phase 1 of the *post-Phase-9 usability improvement plan*, not the original project foundation phase. Developed on `feature/phase-1-admin-usability` from main. No schema/volume reset, migrations, production deployment or main merge.

## Everyday owner experience

The regular admin at `/admin` now offers five navigation entries:

1. **Today** — action-focused confirmed reservations, pending proofs, holds and quick actions.
2. **Schedule** — reservations, **Add Booking**, **Block Court**.
3. **Payments** — pending proof review, payment records, receipts and decisions.
4. **Manage** — courts, pricing rules, weekly opening hours.
5. **My Account** — password and sign out.

**Team Accounts and Venue Settings are removed from the regular navigation, not deleted from the database or system.** One bootstrapped OWNER is the default per venue; OWNER/MANAGER/STAFF roles and authorized staff-management API remain for future venues. No shared-password multi-user accounts are introduced.

**Developer-controlled branding:** The backend `PUT /api/v1/admin/venue` is now disabled by default even for OWNER. A trusted operator/developer controlling server configuration may temporarily set `Developer:AllowVenueEdits=true` (or `Developer__AllowVenueEdits=true` env var) to permit the existing OWNER-only API during authorized changes. Return it to false afterward. This is **not** a separate developer account; users with server configuration privileges control the feature gate. Other court/pricing/opening-hours APIs remain available to venue operators.

## Shared visual schedule

Both Add Booking and Block Court use `frontend/components/admin/AdminSlotPicker.tsx`:

- Venue-local date with prev/next calendar controls and refresh.
- All active courts in a time-by-court matrix on desktop.
- A large-button **court switcher** and one-court time list on narrow mobile screens.
- Clear, independent text/status colors. Only eligible slots can be selected.
- One through eight consecutive time slots, bounded to a single court. Select a new time to restart an invalid/noncontiguous range; backend remains authoritative.
- A selected range summary shows court, time and estimated price.
- Follow-up form appears **only after** court/time selection: guest name, contact, WALK_IN/PHONE/MESSENGER channel, optional notes; block reason for closure.
- Back control is at the **top** of each nested workflow, including mobile payment detail, pricing/court edit forms.
- Existing owner/manager permissions, signed HttpOnly sessions, CSRF checks, payment states and PostgreSQL overlap exclusion remain the authoritative checks.

### Immediate staff walk-in

Phone and Messenger bookings continue to require future AVAILABLE slots. WALK_IN may select the **currently started** slot for at most the first half of its configured duration, capped at 30 minutes; e.g. a 60-minute slot permits 30 minutes of grace, a 30-minute slot permits 15 minutes.

Only the authenticated staff availability endpoint reports `WALK_IN_NOW`:

```text
GET /api/v1/admin/operations/availability?date=YYYY-MM-DD
GET /api/admin/operations/availability?date=YYYY-MM-DD (Next.js staff gateway)
```

The shared schedule checks persisted active overlaps in one batched query before marking an elapsed slot `WALK_IN_NOW`. Creation checks availability again **inside the existing EF transaction**. A stale-but-still-active hold, confirmed booking, maintenance block or overlapping schedule entry still prevents a new reservation; PostgreSQL GiST exclusion is the final guard against races. Immediate walk-in cannot be used for blocks or for a previously completed slot. All accepted staff bookings are CONFIRMED but not automatically paid; price covers full chosen slots.

This is an intentional staff-only exception to public ELAPSED rules; the public `/api/v1/availability` remains unchanged.

## Mobile and operator experience

- Five navigation actions instead of eleven, without hiding courts/hours/rates.
- Sticky admin topbar; existing mobile menu/focus trap retained.
- Reservation tables become labeled cards on phones; readable date, status and action controls.
- Payment queue selection scrolls to review details on narrow screens, with a **top Back to payment queue** control.
- Large touch targets and explicit loading/offline, validation, conflict and success feedback.
- Slot tabs and time selection usable at 320px and 375px design widths.

## Verification status

The source, interface/DTO changes and tests have been added. Test source covers slot extension and walk-in limitations, staff route authorization and proxy allowlist.

**Runtime verification is still required** for this new branch; prior Phase 9 verification on main is not proof for these subsequent changes.

```bash
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
cd frontend
npm ci
npm run check
npm run build
```

Use the existing controlled Phase 9 disposable `_test` workflow for actual booking/block mutations, never the existing venue database. Verify one allowed current walk-in and conflicts with a simultaneous hold/block; verify PHONE/MESSENGER and blocks reject the elapsed slot. Test on a physical phone, and 320/375/768/1024px browser widths, including keyboard/screen-reader navigation.

## Deferred to remaining usability phases

- Public court photo carousel, venue phone/Facebook links and venue-approved payment instructions.
- Player/admin payment-proof preview refinements and full workflow polish.
- Verified cross-device guest recovery and full end-to-end re-audit.

These are **not** claimed implemented by this PR. See the agreed four-phase usability plan.
