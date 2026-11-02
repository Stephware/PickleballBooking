# Agent instructions — PickleballBooking

## Every task

1. Read [docs/context/index.md](docs/context/index.md) first. Open only the topic pages relevant to your current task to conserve tokens.
2. Inspect real code and SQL; documentation and plans are NOT proof that a feature is implemented.
3. Explicitly distinguish approved product decisions, proposed features, implemented functionality, and tested functionality.
4. Keep changes scoped. Preserve one reusable codebase with a separately branded deployment/database per venue. Do not introduce a marketplace without user approval.
5. For any frontend/UI task, read [docs/context/ui-ux.md](docs/context/ui-ux.md). When available in the active environment, use **UI UX Pro Max** for design systems, layouts, typography, and visual direction, then **Impeccable** for usability, accessibility, responsiveness, audits, refinement, and polish. Prefer the existing design system; avoid conflicting redesigns.
6. After substantive changes, update the relevant docs/context topic page, append a brief log entry, and update docs/context/progress.md.
7. Commit AGENTS.md and every docs/context/*.md page to Git. NEVER exclude them via .gitignore.

## Architecture and safety

- Keep the requested repository layout: backend/Pickleball.Api, frontend, database, docs, and PickleballBooking.slnx.
- Backend: ASP.NET Core (.NET 10); planned frontend: Next.js and TypeScript; database: PostgreSQL 17 on Docker.
- The user's PostgreSQL instance is ALREADY working. Never run docker compose down -v, reset its volumes, rerun the schema on real data, or overwrite local .env credentials.
- Each venue has its own database and deployment; court count, rates, hours, policy and branding are configuration, not new tables per client.
- Enforce booking transaction safety and PostgreSQL overlap exclusions. Expired HELD/AWAITING_REVIEW rows must transition to EXPIRED before time becomes free.
- Do not commit secrets, customer information, raw passwords, real payment credentials, or sensitive database exports. Use ASP.NET Core user secrets/environment variables and secure password hashing.
- Compute booking validity and pricing on the server and respect venue timezone (default Asia/Manila).

## Current implementation

The initial backend supports only /health. Authentication, EF Core integration, booking APIs, and the Next.js frontend remain unimplemented. See [docs/context/progress.md](docs/context/progress.md) and verify before claiming otherwise.

## Documentation hygiene

Prefer concise topic pages linking to canonical SQL/code. Update decisions.md when decisions change; do not confuse a plan with working code.
