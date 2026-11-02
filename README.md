# PickleballBooking

Reusable venue-specific pickleball court booking and management application. The **same code and SQL schema** serve separately deployed, branded venue systems, each with its own database, number of courts, rates, schedule, and policies. This is **not** a central marketplace.

## Repository

- `backend/Pickleball.Api/`: ASP.NET Core .NET 10 API scaffold (health endpoint only)
- `frontend/`: placeholder for Next.js + TypeScript + Tailwind
- `database/`: PostgreSQL 17 Compose, starter SQL, sample seed and smoke test
- `docs/context/`: tracked Karpathy-style wiki and UI/UX guide
- `AGENTS.md`: coding-agent instructions
- `PickleballBooking.slnx`: .NET solution

## Getting started

Read [AGENTS.md](AGENTS.md) and [docs/context/index.md](docs/context/index.md). For UI work, read [docs/context/ui-ux.md](docs/context/ui-ux.md).

**Keep the database already running on your Mac.** Moving the Compose file does not move an existing Docker volume. See [database/README.md](database/README.md) before starting another database or changing paths.

With .NET 10 SDK installed:

```bash
dotnet sln PickleballBooking.slnx list
dotnet restore PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

Verify the scaffold at http://localhost:5090/health (this does **not** test PostgreSQL connectivity). Frontend and real booking APIs are not implemented yet.

## Next steps

Map EF Core to the existing PostgreSQL schema without resetting it; implement courts, availability, bookings/holds and staff management; initialize the mobile-first Next.js frontend using reusable branding.

## Secrets and context

Keep actual .env files, payment credentials, passwords, backups and build outputs out of Git. Keep AGENTS.md and docs/context/*.md **in** Git.
