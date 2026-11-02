# PickleballBooking

A reusable, individually branded court booking platform for **one pickleball venue per deployment/database**. The same application code serves different businesses by configuring court counts, rates, hours, branding and booking policies. This is not a marketplace.

## Phase 1 foundation

- **API:** ASP.NET Core .NET 10 with controller/DTO/service/DI pattern, health and status endpoints, CORS allowlist and Problem Details exception handling.
- **Frontend:** Next.js 16 App Router, TypeScript and Tailwind 4. The homepage is an explicit development placeholder; no booking UI is live.
- **Tests:** xUnit v3 unit tests and WebApplicationFactory integration tests (source created; runtime execution pending).
- **Database:** Existing PostgreSQL 17 and SQL schema **unchanged**. EF Core will be integrated in Phase 2.
- **Docs:** Tracked [AGENTS.md](AGENTS.md), [context wiki](docs/context/index.md), and [UI/UX guide](docs/context/ui-ux.md). UI UX Pro Max guides new design; Impeccable guides audit and polish.

## Quick start

Prerequisites: .NET 10 SDK and Node.js 20.9+ (22 recommended).

Terminal 1 (repository root):

```bash
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

Check http://localhost:5090/health and http://localhost:5090/api/v1/system/status.

Terminal 2:

```bash
cd frontend
npm install
npm run check
npm run dev
```

Open http://localhost:3000, then http://localhost:3000/api/backend-health (checks API reachability). After `npm install`, commit the generated `frontend/package-lock.json` to make subsequent installs reproducible.

**Read [docs/development.md](docs/development.md) for troubleshooting, configuration and build details.** Do not recreate, rename or delete the already-running PostgreSQL Docker volume. See [database/README.md](database/README.md).

## Repository structure

```text
backend/Pickleball.Api/               # API controllers, services, DTOs and future data layers
backend/tests/Pickleball.Api.Tests/    # Unit and API integration tests
frontend/                             # Next.js starter and future player/admin UIs
database/                             # Existing Compose and PostgreSQL SQL scripts
docs/context/                         # Tracked wiki, decisions, UI/UX and progress
docs/api/                             # Implemented endpoints
PickleballBooking.slnx                 # Root .NET solution
AGENTS.md                              # AI coding agent conventions
```

## Roadmap

Phase 2: EF Core and database mapping → Phase 3: staff/venue/courts → Phase 4: availability/pricing → Phase 5: booking → Phase 6: payments/manual operations → Phase 7: player frontend → Phase 8: admin frontend → Phase 9: verification/deployment.

## Security and honesty

No real credentials, `.env` files, customer data, payment proofs or database backups should be committed. Keep AGENTS.md and the entire context wiki **tracked in Git**. Phase 1 builds/tests remain unverified in this environment until run on the developer's Mac.
