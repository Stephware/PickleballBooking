# Local development — Phase 1

This document covers the API and Next.js scaffolds only. It does NOT initialize or modify your already-working PostgreSQL database.

## Requirements

- .NET SDK 10 (for PickleballBooking.slnx and net10.0 API/tests)
- Node.js 20.9 or newer, preferably Node 22 LTS
- Docker/PostgreSQL 17 remains configured separately and is not used by Phase 1

## First-time setup

From the repository root:

```bash
dotnet --info
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

The API binds to http://localhost:5090 using backend/Pickleball.Api/Properties/launchSettings.json. Verify:

```bash
curl http://localhost:5090/health
curl http://localhost:5090/api/v1/system/status
```

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 for the placeholder homepage, then http://localhost:3000/api/backend-health to verify the frontend can reach the API. The health proxy returns HTTP 503 while the API is down.

## Frontend validation

```bash
cd frontend
npm run check
npm run build
```

The authoring environment cannot download npm packages or run the .NET SDK, so these build/test commands must be verified locally. When npm install succeeds, commit the generated frontend/package-lock.json. Subsequent builds should use npm ci.

## Configuration and security

- Backend development origin allowlist: backend/Pickleball.Api/appsettings.json → Cors:AllowedOrigins.
- Frontend local API address: frontend/.env.example, copied to frontend/.env.local if changing from default.
- Never commit real .env, database passwords, production secrets, customer data, or private keys.
- Do NOT move/recreate existing Docker volumes. See database/README.md before using database/compose.yaml.
- /health and /api/v1/system/status reflect process health only, **not PostgreSQL availability**.
- No booking APIs, authentication, EF Core, migrations, admin UI, or payment processing yet.

## How to add actual features

- Controller: HTTP/authorization/response boundary, minimal orchestration.
- DTOs: request/response contracts; never expose EF entities directly.
- Service: business decisions, validation and coordination.
- Repository: EF Core queries/persistence; interfaces only where useful.
- Data: EF Core mapping and migrations, implemented in Phase 2.
- Frontend components: shared, configurable for each venue; UI UX Pro Max → build → Impeccable audit.

For each substantive change, update docs/context/progress.md and docs/context/log.md.
