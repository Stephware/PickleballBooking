# API endpoints

Only infrastructure endpoints exist; real court, booking, staff and payment APIs are **not implemented**.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Process health only; doesn't depend on database |
| GET | `/health/db` | Public | PostgreSQL reachable, nine required tables and configured venue row |
| GET | `/api/v1/system/status` | Public | Non-sensitive service name/status/UTC timestamp |

`/health/db` returns HTTP 200 on success or HTTP 503 when connection settings are missing or the DB/schema check fails. It never returns passwords or raw SQL errors.

Unhandled exceptions use Problem Details. Staff/auth, court management, pricing, booking, payment and guest endpoints are planned for Phases 3–6, not exposed today.
