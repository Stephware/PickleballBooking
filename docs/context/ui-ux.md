# UI/UX development guide

Applies to player-facing booking pages and staff/owner admin screens for individually branded deployments of PickleballBooking. This is a workflow standard, NOT a preapproved palette or replacement for actual design tokens. Read [requirements.md](requirements.md) and [decisions.md](decisions.md) with this guide.

## Skill responsibilities

- **UI UX Pro Max:** Use for initial design-system direction, information architecture, layouts, typography, spacing, component patterns, color/token proposals, and visual direction of new screens.
- **Impeccable:** Use for UI/UX reviews, accessibility, responsiveness, refinement, interactive edge cases, visual consistency and final polish.
- For new screens: inspect the existing components/venue brand first → use UI UX Pro Max where available → implement reusable components → run Impeccable for audit/refinement → verify in the rendered UI.
- For a small targeted bug fix, do not forcibly invoke both skills or redesign the entire page. Use only what is relevant.
- The skills are installed globally by the developer, not copied into this repository. If missing in a particular agent environment, follow these guidelines manually and do not falsely claim a skill was run.
- Existing brand specifications and project decisions override generated suggestions. Avoid unnecessary redesigns and conflicting styles.

## Design system

1. Inspect implemented tokens, shared components, screens, and venue configurations before adding styles.
2. On first frontend build, define a compact documented token system: color, typography, spacing, radii, states, focus outlines and responsive breakpoints. Keep token definitions in frontend source and link to them here. Phase 7 establishes the **player design tokens** in [frontend/app/globals.css](../../frontend/app/globals.css) and per-venue contrast-aware CSS variables in [frontend/lib/player.ts](../../frontend/lib/player.ts). New screens must reuse them, not invent a second palette.
3. Build a consistent base UI reusable across venues. Inject logo, brand colors, images, court names/counts and booking policy via config; use scoped, deliberate variations only when justified.
4. Keep player booking, owner dashboard and marketing pages internally consistent. Brand colors must not reduce status clarity or accessibility.
5. Prefer clear, functional and fast interfaces over decorative complexity. Avoid gratuitous animations and arbitrary style changes.

## Product-specific requirements

- **Court display:** List of courts or court-by-time schedule grid. Do NOT replace it with a venue floor plan.
- **Semantic colors:** Green AVAILABLE, red OCCUPIED, gray ELAPSED, yellow PENDING/held, plus distinct blocked/closed styling. Use a readable text label or icon alongside every color; never rely solely on color.
- **Time rules:** ELAPSED is computed from selected date, current time and venue timezone; it is not a persisted booking status. Do not let players select elapsed/closed/blocked/occupied time.
- **Variable court counts:** Support 1, 3, 8, 12+ courts. On mobile, prefer legible court cards or intentional horizontal time-grid scrolling instead of tiny columns.
- **Player path:** Select date → court → available slot → booking/contact details → any required payment/proof → confirmation/status. Show total price, duration and policy before finalizing.
- **Admin path:** Courts, operating hours, rates, walk-in/Messenger/phone bookings, blocks, review and payment confirmation must be discoverable and easy to edit.
- **Edge states:** Loading, no courts, no available times, pending, expired hold, payment validation error, network failure, duplicate submission, concurrency conflict, cancellation and success.

## Quality gate before calling UI finished

- [ ] Follows venue branding and existing shared design system with no conflicting tokens.
- [ ] Clear information hierarchy, readable text, obvious action and accurate status labels.
- [ ] Color is supplementary; all states have clear labels/icons and accessible names.
- [ ] Contrast and focus meet WCAG 2.2 AA where applicable; keyboard and screen reader navigation work.
- [ ] Labels, validation messages and accessible status announcements work correctly.
- [ ] Render tested on representative mobile (~375px), tablet (~768px), and desktop (~1280px+) widths.
- [ ] No clipped controls or accidental page overflow; touch interactions practical.
- [ ] All booking time/price, closed/blocked, pending/expired and conflict states reviewed.
- [ ] Motion is purposeful and respects prefers-reduced-motion; no unnecessary performance cost.
- [ ] Relevant Impeccable findings fixed or documented, and visual UI changes actually viewed/tested.
- [ ] Update context wiki when behavior or durable design rules change.

Document approved design-system paths here once frontend exists; do not duplicate source tokens in docs.

## Phase 7 implemented design baseline

- Sport-editorial typography and visual hierarchy; warm neutral surfaces, restrained CSS court illustration, no stock imagery or gratuitous motion.
- Venue-approved primary/secondary colors are loaded from the public venue API, validated as hex and paired with light/dark foreground chosen for contrast. Status colors remain independent.
- Court/time matrix has sticky time labels, horizontal scrolling on narrow screens and live backend statuses with accessible text (not color-only). Free cells support up to 8 contiguous slots.
- Booking summary and contact form show estimated total, clearly identify a temporary hold and require server-side validation. Payment page never claims an uploaded receipt has been verified.
- Private booking status and proof preview use a server-only gateway and HttpOnly guest token cookie. See [Phase 7 guide](../phase-7-player-frontend.md) for architecture and limitations.
- **Pending UI audit:** actual viewport screenshots at 320/375/768/1024px, keyboard/screen-reader, WCAG contrast sampling, reduced-motion and failed requests. UI UX Pro Max and Impeccable global skill execution is a developer-local step; GitHub alone does not establish that they ran.


## Phase 8 admin baseline

- Reuse player-facing CSS theme variables and frontend/lib/player.ts color contrast; admin-specific scoped styles live in frontend/app/admin/admin.css.
- Desktop sidebar with clear WORKSPACE / OPERATIONS / MANAGEMENT / ACCOUNT grouping; mobile slide-in menu with accessible scrim.
- Task-oriented sections: date-filterable booking table, private payment proof beside amount and reference, separate approved/rejected actions, new manual booking, blocks and form-based court/rate/hours/venue/team management.
- Preserve editable numbers as string inputs in new court/rule forms so a blank field does not force users to erase a leading 0.00. Keep submit/save next to fields and provide feedback inline.
- Status indicators use text and semantic styling; roles affect visibility but never replace backend authorization.
- **Pending:** browser screenshot and keyboard/a11y audit at 320/375/768/1024px, mobile scrolling, nested form validation and reduced motion. UI UX Pro Max/Impeccable run locally only, not through GitHub plugin.

## Phase 9 executed audit — 2026-11-03

UI UX Pro Max form-error guidance and Impeccable context/audit/craft guidance were used while preserving the existing design. Fixed native/React lint issues, mobile hidden-navigation tab access, keyboard focus trap/Escape/return, booking error-summary focus/links, receipt remove/reselect behavior, and measured small-text/brand contrast.

Chrome headless Playwright executed 76 layout checks at 320/375/768/1024px plus three real booking/payment workflow checks (79 total). No page overflow or browser runtime errors in that run. Axe WCAG 2/2.1/2.2 AA rules at 375px reported zero violations in sampled player/lookup/login/form/booking/admin screens. Real three-court flows used the backend/disposable DB; 1/3/8/12-court and empty/closed/outage cases used intercepted read-only availability fixtures. Screenshots were viewed locally; synthetic data/screenshots and auth cookies are not committed.

This is implemented-and-tested evidence for the stated environment, not physical-device or human screen-reader certification. Keep those acceptance checks open. Reproduce with `frontend/tests/e2e/browser-smoke.mjs` per the Phase 9 report.

## Post-Phase-9 Phase 1 admin simplification

Default owner experience has five task-focused sections: Today, Schedule, Payments, Manage and My Account. Schedule's Add Booking and Block Court reuse one visual picker. Keep a desktop court-by-time grid and a readable court switcher on phones. Never introduce tiny multi-court columns on 320–375px devices. Show availability as accessible text plus semantic color; current WALK_IN_NOW is distinct from future AVAILABLE, staff-only and must remain server-confirmed.

Use progressive disclosure: choose court/time first, then only guest details or block reason. Keep the back button at the **top** of nested forms, payment details and editing screens. Preserve private guest tokens, payment review safety and backend price/overlap authority. Team Accounts and Venue Settings are not in the regular menu; adding them back needs an explicit owner UX decision. UI UX Pro Max/Impeccable and real mobile keyboard/touch evaluation remain a new branch verification task.

## Post-Phase-9 Phase 2 public website and payments

- Homepage: use real, **venue-approved** court photography in swipeable gallery if configured; 3–6 landscape images recommended, max 6, alt text and visible arrow/count. No autoplay or invented/stock images. Keep illustrative court art if unset.
- Venue contact: an actual published phone link and Facebook/Messenger profile should be available on homepage and payment/booking help contexts when configured; empty data must not render fake links.
- Payment: method selection reveals approved recipient name/number and optionally verified QR; do not suggest sending a transfer until genuine instructions are configured and confirmed offline. Distinguish receipt SUBMITTED/AWAITING_REVIEW from VERIFIED/CONFIRMED in both language and color.
- Proof previews: users can expand the *local selected file* without server exposure; staff can inspect full-size private image only through authenticated proxy. PDFs remain safe local open (guest) and protected attachment (staff), never publicly embedded.
- Keep back controls at the top of multi-step pages; test phone sizes 320/375, tablet 768 and desktop 1024+, touch/swipe, keyboard/ESC dialog, responsive contact, missing media/error states, real screen readers and reduced motion.

## Post-Phase-9 Phase 3 visual and interaction polish

Use the same typography, spacing, status colors and brand tokens instead of a visual redesign. Prioritize owner **quick actions above KPI summaries**, keep advanced payment ledger collapsed until requested, and make cancellation a booking-specific inline confirmation with reversible "Keep booking" and distinct "Confirm cancellation". Destructive flows require intent but not duplicate confirmations.

For asynchronous views, distinguish loading, genuine empty, and fetch failure; provide a retry button and never display editable dummy opening hours after an error. Ignore stale results when switching dates/payments quickly. Focus the newly revealed form title with `tabIndex=-1`; native `details/summary` hides optional guest token for same-device lookup. Browser Back/Forward should work for admin top-level sections without exposing hidden routes.

Inspect 320/375/768/1024px, screen reader, keyboard Tab/Escape, no horizontal overflow, readable long names, error/retry flows and minimum 44px controls. UI UX Pro Max/Impeccable on the local developer machine can audit further; do not claim execution without evidence.


## 2026-11-03 — Pickleball Reserve visual branding

- Approved presentation: deep burgundy (#80011f), warm cream (#fff9ed), neutral white/stone, compact modern typography and the developer-supplied logo.
- Supplied media: frontend/public/venue/brand-logo.jpg and four real court images court-1.jpg through court-4.jpg. The hero combines an approved venue court image with original paddle-and-ball vector artwork. No generic stock photography or real payment screenshots are used.
- Homepage: accessible desktop navigation and collapsible mobile menu, striking sports hero, Book a Court and How It Works CTAs, three-card scroll-snap court gallery (no autoplay), existing live availability grid, booking steps and venue contact section.
- Player booking uses real server-returned court states, slots, prices, holds and private payment proof flows; all remain unchanged. Green still means available, red reserved, yellow pending, gray elapsed, with separate blocked styling. Colors never replace status text.
- Owner: preserve five sections Today, Schedule, Payments, Manage, My Account; branded sidebar and four mobile quick-navigation entries with full menu access to account/signout. Actions and metrics are live data only, not the example numbers in the mockup.
- Venue-specific presentation configuration is developer managed. The bundled photos are used when the Reserve theme is active and VENUE_GALLERY_JSON is omitted; use VENUE_HIDE_IMPORTED_PHOTOS=true to hide them, including for existing VENUE_GALLERY_JSON=[]. Other venue deployments with VENUE_BRAND_MODE=api must provide their own approved photos.
- All new visual changes remain source implementation until fresh CI, browser screenshots, accessibility and physical phone review. Payment recipient approval and production security gates still apply.


## 2026-11-03 — Clean real-photo hero and phone-only card scheduling

- Keep the real venue court photograph in the homepage hero, with a subtle brand gradient; remove the decorative paddle/ball vector and its unused SVG asset entirely. The feature-benefit strip and redundant hero assurance copy are intentionally omitted.
- Phones at 680 px and below show only Select Court / Select Time cards, not the duplicate horizontally scrolling court-by-time table. The responsive selector still uses the same server-sourced availability, pricing and 1–8 adjacent slot selection; the selection summary, Continue, booking form and payment process remain functional.
- At wider breakpoints keep the existing desktop schedule grid. Browser regression tests assert a single visible picker at 320/375 px and a visible table at 768/1024 px, with the real-photo hero and no illustration/strip.
- No data, API, payment, authentication, owner operations or database changes. Device/venue acceptance gates still apply.
