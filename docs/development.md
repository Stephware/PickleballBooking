# Local development — Phases 1 and 2

## Tools

.NET 10 SDK, Node.js 20.9+ (22 recommended), Docker PostgreSQL 17 running **already** on the user's machine, DBeaver. Do not change or recreate the existing Compose volume.

## Backend setup from repository root

Copy your PostgreSQL **user/password from the working Docker .env**. Do not paste real secrets into GitHub or screenshots.

```bash
dotnet user-secrets set "ConnectionStrings:Pickleball" "Host=localhost;Port=5435;Database=pickleball_db;Username=pickleball_app;Password=YOUR_PASSWORD" --project backend/Pickleball.Api
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

Check:
- `http://localhost:5090/health` → 200 when API process works.
- `http://localhost:5090/health/db` → 200 if user-secrets connection is valid and nine tables + venue row exist; otherwise 503.
- `http://localhost:5090/api/v1/system/status` → non-sensitive API status.

When local user-secrets config is missing, the API scaffold can still run but `/health/db` returns 503. No startup migration runs. Run `database/sql/05_verify_existing_schema.sql` as a **read-only** verification in DBeaver or using your existing PostgreSQL Docker project.

## Optional live PostgreSQL integration tests

The metadata tests are offline. Live tests only connect when `PICKLEBALL_TEST_CONNECTION_STRING` points to an isolated development/test PostgreSQL database.

```bash
PICKLEBALL_TEST_CONNECTION_STRING="Host=localhost;Port=5435;Database=YOUR_ISOLATED_TEST_DB;Username=pickleball_app;Password=YOUR_PASSWORD" dotnet test PickleballBooking.slnx
```

The repository CRUD test is **disabled** by default. Enable only for a disposable test DB with `PICKLEBALL_TEST_MUTATIONS_ENABLED=1`; all writes are wrapped in a rolled-back transaction. Do not use your real venue data for write tests.

## Migration warning

The existing schema is SQL-first, so `Data/Migrations/` deliberately has **no baseline yet**. Do not run `dotnet ef database update`, `EnsureCreated`, `EnsureDeleted`, or `docker compose down -v`. Follow [database-migrations.md](database-migrations.md) for the safe future baseline process.

## Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run check
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/api/backend-health. Install npm dependencies locally and commit the generated `frontend/package-lock.json`.

## Error handling and conventions

- API controllers handle HTTP/validation, services manage business rules, repositories only query/stage data and the unit-of-work saves/coordinates transactions.
- `DateTime` stored in PostgreSQL `timestamptz` must be UTC. `TimeOnly` holds venue-local time-of-day. The existing default venue timezone is Asia/Manila.
- Do not expose EF entities or guest/payment details directly from public API endpoints.
- Preserve SQL constraints, indexes and triggers, especially booking overlap exclusion.
- Run UI UX Pro Max for design direction and Impeccable for audits when doing frontend tasks.
- Update docs/context progress/decisions/log on substantive changes.
