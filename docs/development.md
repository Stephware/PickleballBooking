# Development and repeatable verification

Use .NET 10 SDK, Node.js 22 and PostgreSQL 17. Preserve the existing venue database and credentials; no startup migration/reset is used. Set local `ConnectionStrings:Pickleball`, `Booking:SigningKey` (stable random 32+ bytes) and an absolute private `ProofStorage:Directory` through user-secrets or environment variables. Development uses the existing launch profile; Production also requires explicit hosts and persistent authentication keys (see deployment.md).

```sh
dotnet restore PickleballBooking.slnx
dotnet build PickleballBooking.slnx
dotnet test PickleballBooking.slnx
dotnet run --project backend/Pickleball.Api
```

Global.json selects Microsoft.Testing.Platform. Default tests intentionally skip database mutation scenarios. Never report those skips as live database passes. For real integration tests, initialize only an empty disposable PostgreSQL database using the canonical SQL, then supply `PICKLEBALL_TEST_CONNECTION_STRING` and `PICKLEBALL_TEST_MUTATIONS_ENABLED=1`; its name must end `_test`. Test schema/exclusion checks and test services never recreate a populated venue database. Do not list user-secrets or copy passwords/tokens into logs.

The first owner uses the one-time private CLI bootstrap described in phase-3-authentication.md. No public owner registration exists. `/health` is liveness; `/health/db` must be healthy before normal API workflows.

Frontend environment (`frontend/.env.local`, ignored by Git):

```text
API_BASE_URL=http://localhost:5090
APP_ORIGIN=http://localhost:3000
```

```sh
cd frontend
npm ci
npm run check
npm run build
npm run dev
```

The real npm lockfile is tracked. Production build uses supported Webpack; local Turbopack socket binding failed in the Phase 9 environment. `/` is the player site, `/admin` the staff workspace, `/booking/{code}` private guest status. A booking reference alone never grants access. API_BASE_URL remains server-only. APP_ORIGIN must match the browser origin; production uses the exact public HTTPS origin. TRUST_PROXY_HEADERS is disabled by default and must only be enabled behind the explicitly configured ingress described in deployment.md.

## HTTP integration harness

`scripts/verify-api.mjs` refuses non-loopback targets and any venue whose slug is not `phase9-test-venue`. It additionally requires `PHASE9_MUTATIONS=1`, `PHASE9_API_URL`, `PHASE9_OWNER_EMAIL` and `PHASE9_OWNER_PASSWORD`. Use synthetic test credentials. For a fresh disposable `_test` DB, load `database/sql/01_schema.sql`, `scripts/seed-test.sql`, then bootstrap its owner before running the server. Never apply these test fixtures to existing venue data.

The harness creates synthetic courts and reservations so it can rerun without interval collisions. Respect rate-limit windows or restart **only the isolated test API** between whole test runs; do not weaken production limits. `scripts/verify-deployment.mjs` exercises production images through a loopback-only ingress simulation, checks separate client rate buckets and optionally saves a mode-600 temporary session file for post-recreation persistence checks. It also requires an explicitly labelled test venue.

## Browser verification

The browser harness is `frontend/tests/e2e/browser-smoke.mjs`; Playwright/Axe are optional isolated test tools, not production dependencies. Install them outside the application, e.g. in a disposable tooling directory, and provide module paths:

```sh
E2E_ORIGIN=http://localhost:3099 \
E2E_PLAYWRIGHT_MODULE=/absolute/tooling/node_modules/playwright/index.mjs \
E2E_AXE_MODULE=/absolute/tooling/node_modules/@axe-core/playwright/dist/index.mjs \
node frontend/tests/e2e/browser-smoke.mjs
```

Install Playwright Chromium or supply E2E_CHROME to an installed Chrome executable. By default, public layout/error checks run against the explicitly labelled disposable venue. Add `E2E_MUTATIONS=true`, `E2E_STAFF_EMAIL` and `E2E_STAFF_PASSWORD` for real synthetic booking/payment/staff workflows. Module paths, credentials and evidence output are environment settings. Keep screenshots/session cookies/private proofs outside Git. Browser checks include 320/375/768/1024px layouts, mobile keyboard navigation, token/cookie boundaries, upload review and automated Axe rules. They do not certify physical touch devices or human screen-reader use.

GitHub Actions defines disposable-DB .NET tests, frontend checks/build/audit and real HTTP/browser jobs. Remote CI outcome is separate from local execution evidence; see phase-9-final-verification.md. Production launch/backup/rollback procedures are in deployment.md.
