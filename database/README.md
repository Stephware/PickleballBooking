# Database (PostgreSQL 17)

This folder includes the original Docker Compose and SQL schema from pickleball-db-starter, reorganized for the monorepo. The SQL schema is unchanged and initializes **9 tables only for a NEW EMPTY Docker volume**.

## Existing working PostgreSQL: DO NOT RESET

You already connected to PostgreSQL on localhost:5435 from DBeaver. You do not need to create another instance. Moving this Compose file does not automatically migrate or rename the current Docker volume.

To manage the SAME Docker project from this repository in the future:

1. Locally copy the existing .env from your old starter folder to database/.env. Never commit it or invent a new password.
2. Verify the COMPOSE_PROJECT_NAME, POSTGRES_PORT, POSTGRES_DB and POSTGRES_USER values match the currently running setup. Starter example project name: pickleball_local.
3. Inspect the current project from the repository using:
   docker compose --env-file database/.env -f database/compose.yaml ps
4. If the same project and named volume are selected, up -d can recreate a container to update bind mounts but must NOT delete the volume. Never use down -v.

On an existing database, Docker does not rerun initdb schema scripts. Make schema changes with versioned migrations.

## Brand-new venue only

From database/:

```bash
cp .env.example .env
# Configure a secure password, unused port, and unique Compose project name.
docker compose up -d
docker compose ps
```

DBeaver connection: PostgreSQL, localhost, configured POSTGRES_PORT (starter 5435), database pickleball_db, username pickleball_app, password from your local .env.

Optionally run demo seed and overlap test only in a development DB:

```bash
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U pickleball_app -d pickleball_db < sql/02_seed_demo.sql
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U pickleball_app -d pickleball_db < sql/03_smoke_test.sql
```

## Data model and booking safety

The source of truth is sql/01_schema.sql. It defines venue_settings, staff_users, courts, operating_hours, pricing_rules, customers, court_schedule_entries, bookings, and payments.

The btree_gist exclusion constraint on court_schedule_entries prevents overlapping active holds, confirmed bookings, and blocked periods. The API/worker must explicitly expire stale HELD/AWAITING_REVIEW entries; the schema alone does not implement complete booking policy or authentication.
