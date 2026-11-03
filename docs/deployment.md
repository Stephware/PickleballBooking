# Independent venue deployment

Phase 9 supplies container builds and `deployment/compose.yaml`. This is a runbook, not authorization to deploy a real venue. One small Linux Docker host can run an application stack; budget capacity from measured bookings, memory and backup requirements. A provider, plan, price and production capacity have not been benchmarked.

## Isolation and required configuration

Use the same Git release/image pair for every venue, with a separate Compose project, database, proof volume, authentication-key volume, signing secret, domain and runtime staff accounts. No marketplace or shared customer database is introduced.

Copy `deployment/.env.example` to a private file outside Git, such as `/srv/pickleball/venue-a.env`, mode 600. Replace every placeholder. Generate independent database admin/app passwords and the booking signing key using a cryptographic generator (`openssl rand -hex 32`). Do not put secrets in build arguments, image layers, PRs, logs or command history. Hex database passwords avoid connection-string delimiter escaping. Back up the signing key; changing it invalidates guest access and idempotency derivation.

Required values:

- `COMPOSE_PROJECT_NAME`: unique for this venue, e.g. `pickleball_venue_a`.
- `APP_ORIGIN`: exact public HTTPS origin, without trailing slash/path. This controls frontend origin checks and the scheme asserted to the API.
- `FRONTEND_PORT`: unique loopback host port behind TLS ingress.
- `POSTGRES_PASSWORD`, `DB_APP_PASSWORD`, `BOOKING_SIGNING_KEY`: independently generated secrets.
- `VENUE_NETWORK_PREFIX`: first three octets of a unique private /24 subnet per stack (e.g. `172.30.91`). The frontend uses `.3`; dynamically allocated services use the upper /25 so they cannot take the frontend address. Avoid existing Docker/VPN/LAN networks. The API trusts **only that frontend IP** for forwarded scheme/client address.
- `API_IMAGE`, `FRONTEND_IMAGE`: immutable reviewed commit tags/digests in deployment, retained for rollback. Local defaults are only build conveniences.

API environment settings externalize the connection string, persistent signing key, private proof location, Data Protection directory, allowed host and trusted proxy. Production startup rejects missing keys/storage/DB configuration, wildcard allowed hosts and insecure CORS origins. Protect host storage and backups with encryption and restrictive permissions; Data Protection XML keys are persisted on the private volume and are not automatically encrypted at rest.

## New venue only

Never apply this initialization to the existing working PostgreSQL instance. The deployment Compose file deliberately does **not** mount schema initialization scripts.

From a reviewed checkout, define a per-venue Compose shortcut in your shell:

```sh
dc() { docker compose --env-file /srv/pickleball/venue-a.env -f deployment/compose.yaml "$@"; }
dc config --quiet
dc build
dc up -d database
# Only an EMPTY new venue database:
dc exec -T database psql -U pickleball_admin -d pickleball -v ON_ERROR_STOP=1 < database/sql/01_schema.sql
```

Create the runtime role using `deployment/01_runtime_role.sql` in an interactive administrator psql session. `\password pickleball_app` prompts without echo: enter the generated `DB_APP_PASSWORD`. The script grants SELECT/INSERT/UPDATE, sequence use and the expiry function, with no DDL, table ownership or DELETE rights. Keep the database administrator credential out of the API container. This role script is for the fixed `pickleball` database supplied by this Compose stack; adapt the CONNECT grant explicitly for other database names.

Bootstrap the first owner once using `dc run --rm --no-deps api --bootstrap-owner`, injecting `Bootstrap__OwnerName`, `Bootstrap__OwnerEmail` and `Bootstrap__OwnerPassword` through a temporary private environment/secret provider. Do not save bootstrap credentials to the persistent Compose file; remove them immediately after the command. The CLI refuses once staff accounts exist. No public owner signup exists.

Start API/frontend and verify readiness:

```sh
dc up -d api frontend
dc exec -T frontend node -e "fetch('http://api:8080/health/db').then(r=>{console.log(r.status);process.exit(r.ok?0:1)})"
```

`/health` is process liveness; `/health/db` checks connectivity, nine tables and venue configuration. Keep the API/database unexposed externally. Production cookies remain Secure even though the trusted internal hop uses HTTP.

## TLS ingress is part of the security boundary

Use a trusted TLS reverse proxy on the host, for example Caddy. A venue site block is:

```caddyfile
booking.example.com {
    header Strict-Transport-Security "max-age=31536000"
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto https
    }
}
```

The ingress **replaces** X-Forwarded-For with one validated client address. The frontend publishes on loopback only and enables `TRUST_PROXY_HEADERS=1`; do not expose its container/port publicly or place an untrusted proxy in front. Never blindly forward a user-supplied chain. The BFF validates a single IPv4/IPv6 address, derives the backend scheme from configured APP_ORIGIN, and the API accepts these headers only from its configured frontend IP. This preserves Secure antiforgery over the internal hop and separate per-client rate buckets. With another CDN/proxy in front of Caddy, explicitly configure its trusted peers and the replacement client-address source; that topology is not verified here.

Configure public DNS/certificates/firewall only with separate infrastructure authorization. Test real HTTPS login, Origin failures, cookie Secure/HttpOnly/SameSite, `/health/db`, protected proof preview, a synthetic booking and an approval before opening to customers. The application sets nosniff, no-store, frame-denial and referrer policies; frontend CSP restricts framing/base/object content. This is a partial CSP, not a nonce-based script policy.

## Operations, storage and recovery

Named database/proofs/keys volumes persist across container replacement. Do not remove volumes on upgrades. All replicas of one venue need the same signing secret, Data Protection keys and private proofs; this Compose topology intentionally runs one API and one frontend. Do not copy another venue's secrets or volumes.

Emit API console JSON logs using the supplied formatter setting. Collect logs with size/retention limits at the host; monitor failed health checks, worker errors, latency, 5xx, 429, disk capacity and backup age. Do not enable EF sensitive-data logging or log request bodies, cookies, tokens, staff passwords or proof bytes. Payment proof accepts PNG/JPEG/WebP/PDF signatures up to 5 MiB; PDFs are downloads, never public static content. Signature validation is **not malware scanning**. Arrange verified malware scanning/quarantine and storage retention/access procedures before accepting untrusted public uploads in production.

For a consistent backup, use a brief maintenance window that blocks writes (stop frontend/API), take a PostgreSQL custom-format dump, archive private proofs and Data Protection keys, and preserve the signing secret through your secret-backup mechanism. Then restart the services. Example database backup to a protected directory outside the checkout:

```sh
dc stop frontend api
dc exec -T database pg_dump -U pickleball_admin -d pickleball -Fc > /srv/backups/venue-a/database.dump
# Archive ONLY this project's proofs and keys volumes through your backup tooling.
dc start api frontend
```

Encrypt, restrict and copy backups off-host. Record their release SHA and timestamp. Test restoration into a **different disposable project/database**: restore the dump using pg_restore, restore matching proofs/keys/signing secret, verify health, login, historical guest-token access and proof readability. Never restore over the working venue as a test. A volume alone is not a backup. Actual off-site backup scheduling, restore drills and recovery objectives remain operator acceptance gates.

Upgrade by recording current image digests, taking the above backup, reviewing release notes and replacing images under the same project/environment file. No schema migration is required by Phase 9. Future changes must follow `docs/database-migrations.md`. For rollback, restore the previous immutable image pair while keeping volumes and signing/key configuration stable. Database rollback requires a separately reviewed restore/migration procedure if a later release changes schema; do not assume old binaries understand a new schema.

## Launch acceptance gates

Configure actual branding/courts/hours/rates/staff through owner APIs/UI. Verify official payment recipient instructions with the venue; current UI deliberately has no fabricated account details. Uploaded proof is an unverified claim; operators must reconcile actual funds. Refund endpoints record an already performed external refund and never send money.

Before public launch obtain operator signoff for official payment instructions, malware controls, TLS/cookie tests, secret rotation/recovery, private file retention, backups/restore and monitoring. Cross-device verified guest recovery and normalized booking-source reporting remain deferred. Full production load testing and real payment-provider settlement are not supplied by this release.

## Public media and payment presentation (post-Phase-9 usability Phase 2)

The frontend container passes through only **developer-managed public** `VENUE_*` fields from each private per-venue Compose env file, with safe empty defaults. This does not alter the database, staff roles, private proof storage or credentials. Set `VENUE_GALLERY_JSON` to a JSON array of 3–6 approved local raster assets under `frontend/public/venue/` with meaningful descriptions, e.g. `[{"src":"/venue/court-1.webp","alt":"Main court"}]`. Remove EXIF/location metadata and rebuild/publish the frontend image after adding photographs/QR assets; verify every URL loads under the target host. The image alone never constitutes payment approval.

Provide `VENUE_PHONE`, `VENUE_FACEBOOK_URL` only for genuine published venue channels. For GCash/bank, independently verify the real recipient name, number and any QR destination, then set the relevant account fields and explicitly enable `VENUE_PAYMENT_INSTRUCTIONS_APPROVED=true` for that venue. If omitted/unapproved, the public UI warns users not to send transfers to unknown accounts. On changes to payment destination, disable the approval flag until the replacement has been verified.

These `VENUE_*` variables are displayed publicly **when approved**, but keep the per-venue deployment .env private because it also contains PostgreSQL and signing secrets. Never put payment-proof images in `frontend/public/venue/` or use real account values in Git. Refer to [Phase 2 guide](improvements-phase-2-public-payment.md).

## Phase 4 disposable production-image verification (not a venue deployment)

A new independent GitHub Actions workflow `release-verify.yml` exercises real
production API/frontend Docker images in a unique synthetic Compose project.
It loads a fresh `pickleball_release_test` database only via
`deployment/phase4-ci.compose.yaml`, runs the guarded
`scripts/phase4-verify-release.sh`, then removes **only its own test volumes**.
It never uses the existing `deployment/.env` of a venue or drops a real DB.

The test checks staff/guest sessions and private PNG/PDF proof readability across
API/frontend recreation, owner customization disabled by default, HTTP Origin/CSRF
and rate-limit boundaries, and a custom PostgreSQL dump restored into
`pickleball_restored_test` with nine tables, bookings, payments and exclusion
constraint. It is intentionally **not** a copy of the actual production
backup/restore runbook above. Do **not** use the `_test` overlay, synthetic
credentials or test volume-cleanup steps on a real venue.

Review [Phase 4 release acceptance](improvements-phase-4-final-verification.md)
before authorizing live TLS, malware quarantine, real payment account publication,
off-host backup, data retention or rollout. Both normal GitHub CI and this
isolated production-image workflow must pass for the exact reviewed release.

## Protected payment-review deployment (2026-11-03)

**Existing venue databases MUST be upgraded before deploying this API release.**
Follow [database migration instructions](database-migrations.md). After a backup
and while old API/frontend writes are stopped, run:

```sh
# Admin credentials only, on the correct existing venue database:
psql -v ON_ERROR_STOP=1 -f database/sql/06_payment_review_no_expiry.sql
psql -v ON_ERROR_STOP=1 -f database/sql/05_verify_existing_schema.sql
```

Do not use the synthetic CI database, erase any volume, or assume container
recreation reruns the SQL bootstrap. Old API binaries expect review expiry and
must **not** process bookings after this schema change.

New holds have a 10-minute proof deadline by default (capped at game start).
Proof submitted before the deadline transitions to `AWAITING_REVIEW`, keeping
the court occupied until OWNER/MANAGER approval, rejection or explicitly
reasoned booking cancellation. Pending reviews never auto-expire — **even after
game start** — and approved late reviews must be reconciled with actual game
access. The dashboard flags reviews older than one hour and games starting
within an hour; these are in-app alerts, not email/push notifications.
Staff must check the queue regularly. This policy alone does not authorize
payments, issue refunds or guarantee a game occurred.
