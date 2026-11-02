# Development setup — Phases 1–4

Prerequisites: .NET 10 SDK, Node.js 22 LTS recommended, and your **already-running** PostgreSQL 17 Docker instance on localhost:5435. Do not change the Docker volume.

## Local API database connection

Set `ConnectionStrings:Pickleball` through ASP.NET Core user-secrets (or environment variables). Avoid putting the password literally into saved shell commands:

```bash
dotnet user-secrets set "ConnectionStrings:Pickleball" "Host=localhost;Port=5435;Database=pickleball_db;Username=pickleball_app;Password=YOUR_PASSWORD" --project backend/Pickleball.Api
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

Then check `http://localhost:5090/health` and `http://localhost:5090/health/db`. Database health must be 200 before public availability queries. If you haven't yet created a staff OWNER, follow [Phase 3 owner bootstrap](phase-3-authentication.md).

## Phase 4 endpoint checks

Use an actual date within the configured venue booking horizon; date below is an illustration:

```bash
curl 'http://localhost:5090/api/v1/availability?date=2026-11-03'
curl 'http://localhost:5090/api/v1/availability?date=2026-11-03&courtId=1'
curl 'http://localhost:5090/api/v1/pricing/quote?date=2026-11-03&courtId=1&startsAt=09:00'
```

If there are no courts/opening hours, the response may contain no slots. You can add courts/hours through Phase 3 protected APIs, or use existing sample data, but **do not rerun schema creation SQL**. For pricing rules use the staff login-cookie/CSRF flow documented in Phase 3. Changes in rates affect new quotes immediately, not historical bookings.

## Frontend placeholder

```bash
cd frontend
npm install
npm run check
npm run dev
```

Open http://localhost:3000. Player availability calendar and owner dashboard are **not** implemented until Phases 7–8.

## Safety and verification

- Run `database/sql/05_verify_existing_schema.sql` read-only in DBeaver to verify the SQL constraints.
- Do **not** run `dotnet ef database update`, `EnsureCreated`, `EnsureDeleted`, `Migrate`, or `docker compose down -v`; the current DB is SQL-first. See [migration guide](database-migrations.md).
- Test code covers price precedence, partial slot proration, weekdays, DST, status priority, multi-court slot generation and authorization boundaries.
- A successful static file audit is not proof of a local .NET build, successful network connection, or passing runtime tests. Those checks must be executed on your Mac or a configured .NET runner.
- Never commit .env, staff credentials, customer records, payment proofs or private database exports.

Update docs/context/progress.md and log.md when local verification is completed.
