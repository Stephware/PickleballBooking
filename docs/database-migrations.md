# Schema-first EF Core strategy — do not reset the existing DB

The canonical schema was created with [database/sql/01_schema.sql](../database/sql/01_schema.sql). It already exists in the user's Docker volume and owns 9 tables, functional indexes, check constraints, triggers and a GiST exclusion constraint. Phase 2 adds EF Core **mappings**, not a destructive initial migration.

## Safe approach adopted now

1. Keep the existing PostgreSQL database untouched. Never use `EnsureCreated()`, `EnsureDeleted()`, `Migrate()` at API startup, or `docker compose down -v`.
2. First validate the schema read-only: `database/sql/05_verify_existing_schema.sql`, then `GET /health/db` and `DatabaseModelMappingTests`. Check that no uncommitted manual schema changes exist.
3. Keep `Data/Migrations/` empty during Phase 2. Do **not** run `dotnet ef database update` against the current SQL-first DB. Doing so without a baseline could attempt to recreate the nine existing tables.
4. Before the first future schema change, generate a baseline migration and its full EF Core model snapshot using a .NET-enabled development machine, compare its generated schema operations against the actual SQL, then replace **only** its Up/Down operations with a reviewed no-op baseline. The initial canonical SQL remains the required bootstrap for a brand-new venue. Back up the existing database before applying even the metadata-only migration.
5. Apply and verify that baseline only after review against an isolated clone of the existing database. Commit the generated model snapshot and migration together. Never manually insert fake `__EFMigrationsHistory` records into a live DB without the matching source migration and validated snapshot.
6. Subsequent EF migrations must preserve PostgreSQL-specific SQL objects. If a migration changes `court_schedule_entries`, review and maintain `ex_court_active_time_overlap` explicitly. Any new venue starts from version-controlled bootstrap SQL, then applies reviewed migrations.

## Current status

- EF Core model mapping: **committed in Phase 2 source**.
- Database changes executed: **none**.
- EF Core snapshot/baseline: **not generated**; requires actual local `dotnet ef` output and isolated DB verification.
- This is intentional rather than guessing an unverified snapshot or risking a DB reset.

## Configuration

Use the existing Docker PostgreSQL port 5435 and your current credentials. Run from repository root:

```bash
dotnet user-secrets init --project backend/Pickleball.Api
dotnet user-secrets set "ConnectionStrings:Pickleball" "Host=localhost;Port=5435;Database=pickleball_db;Username=pickleball_app;Password=YOUR_PASSWORD" --project backend/Pickleball.Api
```

`Pickleball.Api.csproj` declares a fixed UserSecretsId; you only need the `set` command if already initialized. `dotnet user-secrets list --project backend/Pickleball.Api` can expose passwords on screen: avoid sharing that output.

Run `dotnet run --project backend/Pickleball.Api` and check `http://localhost:5090/health/db`. HTTP 200 means the DB is reachable and its nine tables and venue row are accessible; HTTP 503 means configuration, connectivity, or schema needs attention.

For optional **live read-only** test against a dedicated dev/test DB:

```bash
PICKLEBALL_TEST_CONNECTION_STRING="Host=localhost;Port=5435;Database=YOUR_ISOLATED_TEST_DB;Username=pickleball_app;Password=YOUR_PASSWORD" dotnet test PickleballBooking.slnx
```

Never set `PICKLEBALL_TEST_MUTATIONS_ENABLED=1` unless using an isolated disposable database. Write tests wrap changes in a rollback transaction but still require test-only credentials.
