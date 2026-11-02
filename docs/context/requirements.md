# Requirements and scope

## User-confirmed decisions

- Create dedicated branded systems **for each pickleball venue**, not one cross-venue marketplace.
- Reuse one core codebase and a common PostgreSQL schema; customize court count, court names, venue identity, rates, hours and visual branding.
- Players book from a **list of courts or a court-by-time grid**, not a physical court-layout map.
- Clear statuses on a selected date's slots: AVAILABLE (green), OCCUPIED (red), ELAPSED (gray). PENDING (yellow) and blocked/closed are useful additional states.

## Proposed MVP — not all features approved or built

### Players

- Branded venue landing page, amenities, hours and court prices.
- Select date, court, and available time slot(s).
- Enter name and at least one contact method; view pricing and booking policies.
- Submit booking, receive confirmation/status, and request cancellation.
- Optional payment/deposit proof submission for owner verification.

### Owner and staff

- Login; manage courts, daily hours, pricing rules and booking policies.
- Record phone, Facebook Messenger, and walk-in bookings in the same availability calendar.
- Confirm/reject bookings, review payments, cancel bookings and block courts for maintenance or events.
- View reservations by date and court; do not require staff to manage separate calendars manually.

## Data integrity and UX

- Revalidate booking requests in the backend; no double bookings under concurrent access.
- Time-limited holds need explicit expiry, and cancelled entries should remain as history.
- Do not persist one row for every available slot; compute from operating hours and active entries.
- Elapsed time and unavailable/blocked court periods must never be bookable.
- Booking status must be textually identifiable, not color only.
- Support any court count responsively; preserve different venue branding without forking shared logic.

## Deferred

Central venue marketplace, matchmaking, memberships, tournaments, loyalty, physical floor-map selection, complex recurring bookings, court-specific opening hours and overnight hours.
