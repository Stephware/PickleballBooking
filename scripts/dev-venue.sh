#!/usr/bin/env bash
# Run five independent frontend *presentations* against one disposable demo API.
# Different Next dev distDir values avoid .next lock/cache collisions.
set -euo pipefail

usage() {
  cat <<'HELP'
Usage: bash scripts/dev-venue.sh <reserve|cave|mad|trnd|angeles>
Runs a branded Next.js frontend at ports 3000–3004, respectively.
Backend should be running at API_BASE_URL (default http://localhost:5090).

For ALL five simultaneously, run each command in a separate terminal.
These share backend bookings, payment proofs and staff users. USE ONLY
a disposable, synthetic demo database. No tenant isolation is provided.
HELP
}

case "${1:-}" in
  reserve)   slug="pickleball-reserve";       port=3000 ;;
  cave)      slug="the-pickle-cave";          port=3001 ;;
  mad)       slug="the-mad-pickle";           port=3002 ;;
  trnd)      slug="trnd-pickleball";          port=3003 ;;
  angeles)   slug="angeles-pickleball-center"; port=3004 ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/frontend"

# Server-only variables. These values override other frontend .env.local
# defaults, so one theme cannot accidentally inherit another's identity.
export VENUE_BRAND_MODE=reserve
export VENUE_TEMPLATE="$slug"
export NEXT_DIST_DIR=".next-$slug"
export APP_ORIGIN="http://localhost:$port"
export API_BASE_URL="${API_BASE_URL:-http://localhost:5090}"
export NEXT_TELEMETRY_DISABLED=1

# A deliberate localhost bind protects synthetic customer/payment demos
# from devices on the LAN. Use a separate real client deployment later.
printf 'Venue: %s\nFrontend: %s\nBackend: %s\nBuild cache: %s\n' \
  "$slug" "$APP_ORIGIN" "$API_BASE_URL" "$NEXT_DIST_DIR"

exec npm run dev -- --hostname 127.0.0.1 --port "$port"
