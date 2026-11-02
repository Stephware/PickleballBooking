# Development setup — Phases 1–3

Requires .NET 10 SDK, Node.js 20.9+ (prefer Node 22 LTS), the existing Docker PostgreSQL 17 instance (DBeaver-connected at localhost:5435), and optional DBeaver. This phase does not modify the DB schema or Docker state.

## One-time backend connection

From repo root:

```bash
dotnet user-secrets set "ConnectionStrings:Pickleball" "Host=localhost;Port=5435;Database=pickleball_db;Username=pickleball_app;Password=YOUR_PASSWORD" --project backend/Pickleball.Api
```

Avoid storing your real connection password in shell history: use a local interactive secret variable or environment setting, then clear it. Never paste sensitive output from `dotnet user-secrets list` into chats.

## Owner setup

Follow [phase-3-authentication.md](phase-3-authentication.md) to configure `Bootstrap:OwnerName`, `Bootstrap:OwnerEmail`, `Bootstrap:OwnerPassword` and run `dotnet run --project backend/Pickleball.Api -- --bootstrap-owner` exactly once. There is no public owner sign-up endpoint.

## Run

```bash
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

- GET http://localhost:5090/health — process only
- GET http://localhost:5090/health/db — PostgreSQL/table/venue check
- GET http://localhost:5090/api/v1/venue — current public venue branding
- GET http://localhost:5090/api/v1/courts — active courts
- GET http://localhost:5090/api/v1/admin/auth/csrf — CSRF token and antiforgery cookie

API auth is cookie + CSRF, not bearer. To test from a browser/client, first request `GET /api/v1/admin/auth/csrf` with `credentials: 'include'`; include the returned `token` in `X-CSRF-TOKEN` for every modifying admin request. For later authenticated mutations, fetch a new token after successful login. See docs/phase-3-authentication.md.

Backend password rotation and staff roles are available as API endpoints only. Admin UI is not yet implemented.

## Frontend placeholder

```bash
cd frontend
npm install
npm run check
npm run dev
```

Next.js stays a placeholder until player/admin UI phases. Commit `frontend/package-lock.json` once generated.

## Safety

`database/sql/01_schema.sql` is canonical and unchanged. No `EnsureCreated`, `Migrate`, Docker volume reset, or automatic schema upgrades. See docs/database-migrations.md. Integration tests require a separate PostgreSQL test DB for mutation; local build/tests remain pending verification.
