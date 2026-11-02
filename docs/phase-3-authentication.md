# Phase 3 — staff authentication and venue setup

This phase works with the **existing nine-table SQL-first database**. No new tables or EF migrations are run. It is API-only; admin UI screens come in Phase 8.

## Authentication architecture

- Uses existing `staff_users` columns, no added ASP.NET Identity schema.
- `IPasswordHasher<StaffUser>` (ASP.NET Core Identity hasher) stores salted hashes, not plaintext.
- Staff sessions use encrypted/signed **HttpOnly** cookies (8-hour maximum, no sliding renewal). `SameSite=Lax`; HTTPS-only cookies outside Development.
- Cookie principal is rechecked against `staff_users` for active state, role **and password fingerprint** on each request. Password changes invalidate earlier cookies. Logout clears the current browser cookie; for a suspected stolen session, rotate the password.
- All modifying `/api/v1/admin/**` routes (including login/logout) require antiforgery token header `X-CSRF-TOKEN`. Get the token/cookie via `GET /api/v1/admin/auth/csrf` and send requests with `credentials: "include"`. After login, **request a fresh CSRF token** for authenticated user actions.
- Login has an IP-partitioned fixed-window limiter (5 attempts/minute). In reverse-proxy deployments configure trusted forwarded headers and edge rate limiting; do not trust arbitrary X-Forwarded-For headers.
- For production, expose API and Next.js through one trusted HTTPS origin (same-site reverse proxy); do not use cross-domain cookies or broad CORS.

## Bootstrap initial OWNER — one-time CLI only

You already have a database. Do NOT reinitialize it. From the repository root, configure connection secrets first (see README). Then:

```bash
dotnet user-secrets set "Bootstrap:OwnerName" "Venue Owner" --project backend/Pickleball.Api
dotnet user-secrets set "Bootstrap:OwnerEmail" "owner@example.com" --project backend/Pickleball.Api
# Do not put the password literal into a saved command or Git file.
read -s "OWNER_PASSWORD?Enter initial owner password: "
echo
dotnet user-secrets set "Bootstrap:OwnerPassword" "$OWNER_PASSWORD" --project backend/Pickleball.Api
unset OWNER_PASSWORD
dotnet run --project backend/Pickleball.Api -- --bootstrap-owner
dotnet user-secrets remove "Bootstrap:OwnerPassword" --project backend/Pickleball.Api
```

**Shell note:** `read -s "VAR?prompt"` is for zsh on macOS; bash uses `read -s -p "prompt" VAR`.

The bootstrap refuses to execute when `staff_users` is nonempty; it does not create a public owner-registration route. The command stops after creating the initial owner. Run only once, and store recovery credentials securely.

## API endpoints and roles

Public:
- `GET /api/v1/venue` public branding
- `GET /api/v1/venue/hours` operating hours
- `GET /api/v1/courts` active court list

Staff auth:
- `GET /api/v1/admin/auth/csrf` issues antiforgery pair, public
- `POST /api/v1/admin/auth/login` creates staff cookie (valid CSRF required)
- `POST /api/v1/admin/auth/logout` signs out
- `POST /api/v1/admin/auth/change-password` changes the current staff member's password (requires current password, signs out all previous cookies)
- `GET /api/v1/admin/auth/me` reads signed-in profile

Admin:
- `GET /api/v1/admin/courts` all courts, including inactive; any staff
- `GET /api/v1/admin/courts/{id}` court detail; any staff
- `POST /api/v1/admin/courts`, `PUT /api/v1/admin/courts/{id}` owner or manager
- `GET /api/v1/admin/venue`, `GET /api/v1/admin/venue/hours` any staff
- `PUT /api/v1/admin/venue` owner only (branding/booking policies)
- `PUT /api/v1/admin/venue/hours` owner or manager (all 7 days, 0=Sun, closed days have null opening/closing)
- `GET /api/v1/admin/staff`, `POST /api/v1/admin/staff`, `PATCH /api/v1/admin/staff/{id}/active`, `POST /api/v1/admin/staff/{id}/reset-password` owner only

New accounts may be MANAGER or STAFF; an owner cannot be deactivated through the API. The owner password cannot be reset by other staff. General owner recovery/rotation will require a separate secure flow.

## Design constraints

- Courts are **soft-deactivated**, never deleted from an owner API; history remains intact. Deactivation is rejected while future HELD/AWAITING_REVIEW/CONFIRMED reservations remain; staff must resolve them first.
- Court base hourly rate is editable. Rich pricing rules belong in Phase 4.
- Venue settings validate timezone, slug, HTTPS logo URL, hex colors, slot duration and policy ranges.
- All seven weekday records update as one EF Core save operation; missing days or invalid ranges are rejected.
- Authentication is browser-cookie based; Next.js integration in Phase 8 must forward credentials and CSRF correctly, never store auth cookies in localStorage.

## Tests and next steps

```bash
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

Testing requires local PostgreSQL and API credentials for authenticated CRUD. This environment cannot execute .NET; do not treat source review as runtime verification. No migration or seed operation is performed by the code.
