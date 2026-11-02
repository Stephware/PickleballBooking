# PickleballBooking

A reusable court booking platform with **one independently branded application deployment and PostgreSQL database per venue**. Multiple venues use the same code, but each sets its own courts, prices, opening hours, booking policy and branding. This is not a shared marketplace.

## Current state

- **API:** ASP.NET Core .NET 10, controllers/services/DI, process health + database health, centralized errors and CORS.
- **Data (Phase 2):** Npgsql EF Core 10 mapping to the existing nine-table PostgreSQL schema, context, repositories and unit-of-work. No DB schema recreated.
- **Frontend:** Next.js 16 + TypeScript + Tailwind 4 development placeholder. No booking UI yet.
- **Tests:** Unit and opt-in PostgreSQL integration tests included; execution still needs local .NET verification.
- **Documentation:** Tracked [AGENTS.md](AGENTS.md), [context wiki](docs/context/index.md), [UI/UX guide](docs/context/ui-ux.md).

## Run the existing database connection

Your Docker/PostgreSQL instance on port 5435 is already working; do **not** delete its volume, rerun the initialization SQL or move it into a new Compose project.

Configure backend credentials outside Git:

```bash
dotnet user-secrets set "ConnectionStrings:Pickleball" "Host=localhost;Port=5435;Database=pickleball_db;Username=pickleball_app;Password=YOUR_PASSWORD" --project backend/Pickleball.Api
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

Then open `http://localhost:5090/health` and `http://localhost:5090/health/db`. Database health must return 200 after connecting. You can also run read-only [database schema verification SQL](database/sql/05_verify_existing_schema.sql) in DBeaver.

Frontend:

```bash
cd frontend
npm install
npm run check
npm run dev
```

Open http://localhost:3000. Commit `frontend/package-lock.json` after first successful npm installation.

## Important

**Do not run `dotnet ef database update` yet.** The database existed before EF Core; migration baseline + snapshot must be generated and reviewed first. See [docs/database-migrations.md](docs/database-migrations.md) and [docs/development.md](docs/development.md).

Future work: Phase 3 staff auth/venue/courts, Phase 4 availability/pricing, Phase 5 atomic booking engine, Phase 6 payments/manual booking, Phase 7–8 UI, Phase 9 deployment/testing. The database and Compose files remain tracked and unchanged, while passwords, backups and .env are ignored.
