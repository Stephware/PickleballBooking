# Progress and verification

Last updated: 2026-11-03

## User-reported setup (not changed by Phase 1)

- [x] PostgreSQL 17 Docker database running on Mac; DBeaver authentication/connection resolved (user reported).
- [x] Previous nine-table schema and seed/smoke-test SQL supplied.

## Phase 1 — project foundation (files implemented)

- [x] Root .NET 10 solution includes API and test project.
- [x] Controller, DTO, service, dependency injection and structured error-response foundation.
- [x] GET /health and GET /api/v1/system/status (process only; no database check).
- [x] Explicit CORS allowlist for the local Next.js development origin.
- [x] Empty directories for future entity models, repositories, EF mapping, security, storage and background jobs; **no fake implementations**.
- [x] Next.js 16 App Router, TypeScript, Tailwind 4 scaffold; neutral accessible placeholder homepage.
- [x] Server-only Next.js backend-health proxy: /api/backend-health.
- [x] xUnit v3 unit test and WebApplicationFactory integration test source files.
- [x] Local development guide, API inventory, wiki and agent instructions updated.
- [x] Database schema and Docker volumes untouched by Phase 1.

## Execution verification (pending)

- [ ] dotnet restore, build and dotnet test: .NET SDK unavailable in authoring runtime.
- [ ] npm install, lint, typecheck and Next.js build: package registry unavailable in authoring runtime.
- [ ] Run API/Next.js simultaneously on user's Mac; verify frontend-to-backend health route.
- [ ] Generate and commit frontend/package-lock.json after npm install on user's Mac.

## Future phases — not implemented

- [ ] Phase 2: EF Core schema mapping, DbContext, repositories, safe migration baseline and real PostgreSQL connectivity.
- [ ] Phase 3: staff authentication, role permissions, courts/venue settings.
- [ ] Phase 4: availability and pricing engines.
- [ ] Phase 5: concurrency-safe booking engine and expiry worker.
- [ ] Phase 6: payments and offline/manual booking workflows.
- [ ] Phase 7: public booking frontend and venue branding.
- [ ] Phase 8: owner/admin frontend.
- [ ] Phase 9: E2E validation, hardening, reusable venue deployment.

**Completion gate:** Do not mark Phase 1 runtime-verified until its API and Next.js check commands pass locally. Source implementation is staged and ready to test.
