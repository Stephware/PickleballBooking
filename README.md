# PickleballBooking

Reusable, branded pickleball court booking platform: **one deployment and PostgreSQL database per venue**, sharing source code while customizing courts, operating hours, rates and branding. Not a shared marketplace.

## Implemented source

- **Phase 1 (merged):** .NET 10 API foundation, Next.js 16 + TypeScript/Tailwind placeholder, tests, agent wiki.
- **Phase 2 (PR #2):** Npgsql/EF Core 10, nine SQL-first entities/mappings, repositories and /health/db. DB migrations are **not** automatically applied.
- **Phase 3 (stacked branch):** Staff cookie auth, CSRF, roles, CLI-only owner bootstrap, staff APIs, venue settings/hours and court CRUD (soft-deactivation). Still no public booking or payment flows.

## Run

```bash
dotnet user-secrets set "ConnectionStrings:Pickleball" "Host=localhost;Port=5435;Database=pickleball_db;Username=pickleball_app;Password=YOUR_PASSWORD" --project backend/Pickleball.Api
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

Check `http://localhost:5090/health` and `http://localhost:5090/health/db`. Do not commit real credentials or .env files; the above connection command can expose the password in shell history. For a secure setup see [docs/development.md](docs/development.md) and [docs/phase-3-authentication.md](docs/phase-3-authentication.md), including **one-time owner bootstrap** and the required CSRF cookie/header flow.

Frontend placeholder:

```bash
cd frontend
npm install
npm run check
npm run dev
```

Open http://localhost:3000. The `frontend/package-lock.json` should be committed once generated.

## Documentation and safety

Read [AGENTS.md](AGENTS.md), [docs/context/index.md](docs/context/index.md), and [docs/context/ui-ux.md](docs/context/ui-ux.md) for frontend work. AI coding agents should follow global UI UX Pro Max for design direction and Impeccable for accessibility/refinement.

**Never delete or recreate the existing Docker volume, rerun schema creation on it, or run `dotnet ef database update` before a reviewed SQL-first baseline.** See [docs/database-migrations.md](docs/database-migrations.md).

The source has not been runtime-built or validated against the developer's live PostgreSQL in this environment. Later phases add pricing/availability, bookings, payments, player UI, admin UI, and deployment hardening.
