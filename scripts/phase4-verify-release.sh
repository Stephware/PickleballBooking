#!/usr/bin/env bash
# Fully isolated production-image, persistence and restore check. CI ONLY.
# No connection to a real venue database, no use of the developer's env file.
set -Eeuo pipefail

die() { echo "Phase 4 release verification refused: $*" >&2; exit 1; }
[[ "${GITHUB_ACTIONS:-}" == "true" ]] || die "GitHub Actions isolation required"
[[ "${PHASE4_ISOLATED_TEST:-}" == "1" ]] || die "PHASE4_ISOLATED_TEST=1 required"
[[ "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ ]] || die "Missing GitHub run identifier"
[[ "${COMPOSE_PROJECT_NAME:-}" == "pickleball_phase4_${GITHUB_RUN_ID}_test" ]] ||
  die "Must use this run's uniquely scoped disposable project"
[[ "${PHASE4_TEST_DATABASE:-}" == "pickleball_release_test" ]] ||
  die "Only the designated disposable _test database is allowed"
[[ "${APP_ORIGIN:-}" == "https://phase4-ci.example.test" ]] ||
  die "Must use the reserved synthetic HTTPS origin"
[[ "${FRONTEND_PORT:-}" == "3198" ]] || die "Must bind the synthetic frontend port 3198"
[[ "${DB_APP_PASSWORD:-}" == "ci-phase4-test-app-only" ]] ||
  die "Must use the known disposable app credential, not a venue secret"
[[ "${POSTGRES_PASSWORD:-}" == "ci-phase4-test-admin-only" ]] ||
  die "Must use the known disposable admin credential"
[[ "${BOOKING_SIGNING_KEY:-}" == "ci-phase4-only-signing-key-not-for-real-venue-0123456789" ]] ||
  die "Must use the known disposable signing key"
[[ -d .github/workflows && -f database/sql/01_schema.sql ]] ||
  die "Run from the checked-out repository root"
command -v docker >/dev/null || die "Docker is required"
command -v node >/dev/null || die "Node 22 is required"
command -v curl >/dev/null || die "curl is required"

dc() {
  docker compose -f deployment/compose.yaml -f deployment/phase4-ci.compose.yaml "$@"
}

# Never reuse/delete even a previously created test volume. Every run must start
# with a fresh project and a fresh database. Only volumes we create can be deleted.
for suffix in database proofs keys; do
  if docker volume inspect "${COMPOSE_PROJECT_NAME}_${suffix}" >/dev/null 2>&1; then
    die "Volume ${COMPOSE_PROJECT_NAME}_${suffix} already exists; refusing to alter it"
  fi
done

created=0
cleanup() {
  status=$?
  if [[ "$created" == 1 ]]; then
    echo "Cleaning up only isolated CI project: $COMPOSE_PROJECT_NAME"
    dc down --volumes --remove-orphans || true
  fi
  exit "$status"
}
trap cleanup EXIT

dc config --quiet
created=1
dc build
dc up -d database
dc exec -T database psql -U pickleball_admin -d "$PHASE4_TEST_DATABASE" \
  -v ON_ERROR_STOP=1 < database/sql/01_schema.sql

# Only the synthetic database receives seed data or the disposable app role.
dc exec -T database psql -U pickleball_admin -d "$PHASE4_TEST_DATABASE" \
  -v ON_ERROR_STOP=1 < scripts/seed-test.sql

dc exec -T database psql -U pickleball_admin -d "$PHASE4_TEST_DATABASE" \
  -v ON_ERROR_STOP=1 <<'SQL'
CREATE ROLE pickleball_app LOGIN PASSWORD 'ci-phase4-test-app-only';
GRANT CONNECT ON DATABASE pickleball_release_test TO pickleball_app;
GRANT USAGE ON SCHEMA public TO pickleball_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO pickleball_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pickleball_app;
GRANT EXECUTE ON FUNCTION expire_pending_schedule_entries() TO pickleball_app;
SQL

# One OWNER account for a single synthetic venue; no public registration.
dc run --rm --no-deps \
  -e Bootstrap__OwnerName="Phase 4 CI Owner" \
  -e Bootstrap__OwnerEmail="owner@phase4.example.test" \
  -e Bootstrap__OwnerPassword="CI-Phase4-Owner-Only!" \
  api dotnet Pickleball.Api.dll --bootstrap-owner

dc up -d api frontend
check_frontend() {
  for attempt in $(seq 1 60); do
    if curl --fail --silent "http://127.0.0.1:${FRONTEND_PORT}/api/player/venue" >/dev/null; then
      return 0
    fi
    sleep 2
  done
  die "Disposable production frontend failed readiness"
}
check_frontend

export PHASE9_MUTATIONS=1
export PHASE9_DEPLOYMENT_URL="http://127.0.0.1:${FRONTEND_PORT}"
export PHASE9_APP_ORIGIN="$APP_ORIGIN"
export PHASE9_OWNER_EMAIL="owner@phase4.example.test"
export PHASE9_OWNER_PASSWORD="CI-Phase4-Owner-Only!"
export PHASE9_SESSION_FILE="${RUNNER_TEMP:?}/phase4-ci-session.json"

# Synthetic real-API booking, staff cookies/CSRF, proof privacy, rate-limit buckets.
node scripts/verify-deployment.mjs

# Recreate ONLY disposable API/frontend containers. Named keys/proofs/DB volumes
# remain mounted, then verify old session, guest token and proof are still usable.
dc up -d --no-deps --force-recreate api frontend
check_frontend
node scripts/verify-deployment.mjs

# Dump only the disposable database; restore into ANOTHER disposable DB, never
# the currently used database. Check records AND PostgreSQL exclusion constraints.
backup="${RUNNER_TEMP}/phase4-ci-database.dump"
dc exec -T database pg_dump -U pickleball_admin -d "$PHASE4_TEST_DATABASE" -Fc > "$backup"
[[ -s "$backup" ]] || die "Database dump was empty"
dc exec -T database psql -U pickleball_admin -d postgres \
  -v ON_ERROR_STOP=1 -c 'CREATE DATABASE pickleball_restored_test;'
dc exec -T database pg_restore -U pickleball_admin -d pickleball_restored_test \
  --no-owner --no-privileges < "$backup"

count() {
  dc exec -T database psql -U pickleball_admin -d pickleball_restored_test \
    -At -c "$1" | tr -d '\r'
}
tables=$(count "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
bookings=$(count 'SELECT count(*) FROM bookings;')
payments=$(count 'SELECT count(*) FROM payments;')
exclusions=$(count "SELECT count(*) FROM pg_constraint WHERE contype='x';")
[[ "$tables" =~ ^[0-9]+$ && "$tables" -ge 9 ]] || die "Restored database tables missing"
[[ "$bookings" =~ ^[0-9]+$ && "$bookings" -gt 0 ]] || die "Restored bookings missing"
[[ "$payments" =~ ^[0-9]+$ && "$payments" -gt 0 ]] || die "Restored payment records missing"
[[ "$exclusions" =~ ^[0-9]+$ && "$exclusions" -gt 0 ]] || die "Restored GiST exclusion missing"
echo "PASS Phase 4 isolated Compose production images + session/proof persistence + restore ($tables tables, $bookings bookings, $payments payments, $exclusions exclusion constraint(s))"
