# Usability improvements — Phase 3: Workflow refinement and consistency

**Context:** Post-Phase-9 usability plan, following the Phase 1 simplified owner dashboard (PR #11) and Phase 2 player/payment UX (PR #12). This phase refines existing behavior; it is not the original backend Phase 3.

## Scope and rationale

Prioritize simple daily work over additional features. Changes are limited to
the Next.js frontend, its existing browser regression harness, and documentation.
The same backend roles, canonical server-side booking/pricing/availability/payment
decisions, one Owner default, protected private payment proofs, SQL-first schema,
Docker volumes, and venue branding gate remain intact.

### Owner / staff usability

- **Today:** Add Booking, Review Payments, and (for Owner/Manager) Block Court are at the top, before metrics and lists. This avoids scrolling past summary cards just to perform daily work.
- **Reservations:** Cancellation requires an explicit booking-specific action, then shows a short inline confirmation and optional reason **beside that booking**. No site-wide cancellation reason at the bottom of the page. The second confirmation is intentionally retained for a destructive action; there is no extra browser confirmation on top.
- **Payment reviews:** Regular proof queue remains primary. "Other payment actions" (look up payment records, record external receipts/refunds) is an expandable native disclosure, not always displayed. A race guard ensures a slow response for one selected payment cannot replace the details for another. A failed queue load offers retry instead of falsely claiming nothing is pending.
- **Opening hours:** A failed initial load is **not** converted into editable placeholder hours. The owner sees a retry state; saving is impossible until the actual schedule has been fetched successfully.
- **Reservations:** Date changes invalidate old requests and statuses; failed loads offer retry, not misleading empty data. Status-only empty results offer a one-tap "Show all statuses."
- **Shared fetch hook:** `useAdminResource` now ignores stale responses after date/tab changes or unmount, sets a loading state for refresh, and exposes a consistent retry path.
- **Navigation:** Top-level admin sections participate in browser Back/Forward history; legacy deep-link hashes still map into approved sections. Regular navigation is still five sections. Block Court is hidden from staff-only role UI; the backend remains the permission authority.
- **Guided staff workflows:** On entering booking details or block reason, keyboard focus moves to the relevant heading and scrolls it into view. Nested steps keep top-positioned Back controls.

### Player usability

- **Booking details:** Corrects the misleading "Step 2 of 2" label to "Step 2 · Booking details"; focuses the new form heading after selection instead of a hard-coded timer.
- **Booking lookup:** Asks for booking reference first; an optional private access token appears only when the guest chooses "Using another device?" This does not weaken private guest access checks. A top-positioned Back to courts link is present.
- **Booking status:** Removes the redundant Reload page action; the existing Refresh status control remains. Payment and booking status remain explicitly different.

## Responsive/accessibility details

Keep the approved visual language and brand tokens. Inline cancellation has readable
labels and separate reversible/irreversible buttons, native `details/summary` is
keyboard-operable, mobile actions use minimum 44px targets, focused headings can
be reached by keyboard, and status/load errors retain readable text. Recheck at
320px/375px/768px/1024px. Browser history behavior and progressive token
disclosure are included in the Playwright smoke harness.

## Security, data and feature boundaries

- No changes to `backend/`, `database/`, payment approval logic, or migration scripts.
- Staff role checks continue server-side; hiding a button does not authorize access.
- Owner-controlled branding remains disabled by default unless an authorized
  server operator enables `Developer:AllowVenueEdits=true` on the backend.
- Destructive cancellation still needs a visible confirmation and does not
  automatically refund payment.
- Account recovery still requires the original session or a valid private
  token; this phase does **not** implement unverified recovery via code alone.
- Receipt images remain private and are never moved into public storage.

## Verification checklist

```sh
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
cd frontend
npm ci
npm run check
npm run build
```

Run the existing CI disposable PostgreSQL/browser suite with Playwright and Axe.
Verify Today actions above metrics, admin Back to Today after visiting Payments,
advanced ledger collapsed by default and expandable, guest private token collapsed
until requested, and keyboard focus on booking form. Also manually exercise:
fast date selection requests, slow payment detail responses, inline cancellation
confirm/abort, lost network while opening hours load, mobile form navigation,
and role-limited staff views.

**Status:** Source implemented; results must be recorded from this branch's actual
CI run, not reused from Phase 2.

## Deferred

Phase 4 is the final holistic regression/security/deployment and physical-device
audit. Actual venue photos, contact/payment recipient/QR approval, malware controls,
production TLS/backup acceptance, and genuine payment reconciliation remain separate
launch requirements; no real financial transfer was simulated here.
