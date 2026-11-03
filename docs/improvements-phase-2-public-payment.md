# Usability improvements — Phase 2: Public Website and Payment Experience

**Scope:** Phase 2 of the approved post-Phase-9 usability plan. Implemented on
`feature/phase-2-public-payment-experience` from the Phase 1 merge on `main`.
No database schema, API booking/payment logic, private proof-storage, Docker
volume, user-authentication or migration changes.

## Player website

- `VenueGallery` replaces the decorative court illustration when **real venue photos** are configured;
  3–6 recommended; hard cap 6, swipe/scroll-snap on mobile, arrow buttons and current-photo count.
  No autoplay, ads, fake stock imagery or owner-side upload workflow. Static paths must
  match `/venue/...` JPG/PNG/WebP/AVIF images deliberately deployed to
  `frontend/public/venue/`. Descriptive alt text is required. The existing
  illustration stays as fallback when not configured.
- Contact section exposes an approved dialable phone number and approved
  Facebook/Messenger destination. Both are optional and strictly validated;
  no fake contact links. Links open only trusted Facebook/m.me domains.
- Player booking form has a **top-positioned Back to court and time** button,
  preserving existing server-priced hold, idempotent retries, statuses and deadlines.

## Payment clarity

The booking status page passes *public, developer-managed* venue payment configuration
to the guest payment form. The selected GCash or bank transfer method displays only
validated, **explicitly approved** real account details:

- GCash: account holder, mobile number and optional QR image.
- Bank transfer: bank name, account holder, account number and optional QR image.
- Recipient instructions appear only when `VENUE_PAYMENT_INSTRUCTIONS_APPROVED=true`
  **and** the selected method has all required fields.
- If not approved or incomplete, the page **does not invent an account or QR**.
  It warns the guest not to transfer to unverified details, and provides venue contact
  actions when configured. The existing receipt submission remains possible for a guest
  who already paid using a method confirmed directly by the venue.
- The page always says proof submission is **not** payment verification or booking confirmation.
  The backend still requires OWNER/MANAGER reconciliation against external records.

## Proof preview

- Players can inspect their selected local image at full size using a native
  focus-trapping `dialog`; ESC/Close returns to the form. PDFs can be opened
  **locally** from the File input blob URL before submission; they are not uploaded
  to a public location. Invalid files and 0-/oversize files are rejected locally,
  and object URLs are revoked on change/unmount.
- Staff can tap a privately fetched receipt image to view a larger copy; both
  thumbnail and enlarged image use the existing authenticated, no-store
  `/api/admin/payments/{id}/proof` gateway.
- If the receipt is a PDF, the protected backend continues to send it as a
  **download attachment**. The interface shows a clear PDF/download fallback
  rather than a broken image. Staff still must compare actual payment records
  before approving.

No private proof bytes are committed, moved into `public` or exposed by code-only
booking references.

## Developer configuration

All public presentation fields are **read by the Next.js server only**, validated
and passed to components. There is no owner-side customization form. The existing
venue display name/colors/timezone and court schedule remain sourced from the .NET API.

Set values in `frontend/.env.local` on development or the appropriate per-venue
deployment environment. **Do not commit actual payment account credentials or venue
private data.** Example:

```dotenv
VENUE_PHONE=
VENUE_FACEBOOK_URL=
VENUE_GALLERY_JSON=[]
VENUE_PAYMENT_INSTRUCTIONS_APPROVED=false
VENUE_GCASH_NAME=
VENUE_GCASH_NUMBER=
VENUE_GCASH_QR_PATH=
VENUE_BANK_NAME=
VENUE_BANK_ACCOUNT_NAME=
VENUE_BANK_ACCOUNT_NUMBER=
VENUE_BANK_QR_PATH=
```

When real venue assets and approval are available, the developer can set
`VENUE_GALLERY_JSON` to a JSON array of `{"src":"/venue/court-1.webp","alt":"..."}`.
Use publicly served raster images; optimize and strip EXIF first. QR image paths
must also use `/venue/...`. Always verify that the account/QR matches the venue's
official destination **outside the application** before turning on the approval gate.
Unset or disable the gate immediately when payment details change. No backend storage
or owner dashboard controls are added.

## Verification / limits

New pure-unit tests cover safe image paths, invalid gallery data, six-photo cap,
validated phone/Facebook URLs, missing account values, and approval gating.
The Playwright receipt workflow exercises image thumbnail and full-size preview
for both guest and authenticated staff. Run:

```sh
dotnet test PickleballBooking.slnx
cd frontend
npm ci
npm run check
npm run build
```

Run the existing disposable-venue browser harness and inspect real layouts
at 320/375/768/1024px, and test actual venue images, swipe, phone/Facebook
links, official QR and PDF preview/download **after a venue supplies assets**.
Previous CI results are historical until this branch's checks pass.

**Outstanding launch requirements:** Venue-approved actual recipient/QR and photos
have not been supplied, and receipt malware scanning, TLS/DNS, backups,
cross-device guest recovery and physical-device/screen-reader evaluation remain
separate operator work. Phase 3 will polish remaining UI friction, Phase 4
will perform the final full UX/security/regression audit.

## Executed verification — 2026-11-03

GitHub Actions [41584555464](https://github.com/Stephware/PickleballBooking/actions/runs/41584555464) completed successfully on commit `c389e94`.
.NET restore/build and 107 database-backed tests passed; frontend lint/types, 28 Node tests and Webpack production build passed. 29 synthetic HTTP API scenarios passed against an isolated PostgreSQL database. Existing Playwright and sampled Axe browser checks (320px, 375px, 768px, 1024px, guest/staff receipt workflow) passed with zero page runtime errors. The runtime dependency audit reported zero vulnerabilities; there remain 16 moderate advisories among development tooling dependencies.

This confirms the existing player/admin booking and receipt flow with Phase 2 preview changes. **It does not mean real court photographs, account numbers, QR scans, real PDF files, physical phones or real transfers were verified.** Those require approved venue input and a final physical-device audit; no production deployment was performed.
