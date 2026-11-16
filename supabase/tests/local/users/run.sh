#!/usr/bin/env bash
# Users and access in a browser against a throwaway local database: starts the harness database, applies every
# migration, runs the user_admin_rls.sql checks, then browser.mjs, which starts the gateway (with the admin-users Edge
# Function's own logic behind /functions/v1/admin-users) and the portal's production build.
# Build the portal for the harness first:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
#   TURBO_FORCE=true pnpm --filter @lexta/portal build
# Usage: USERS_SCREENSHOTS=/some/folder bash supabase/tests/local/users/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node '$DIR/browser.mjs'" bash "$DIR/../run.sh" "${1:-user_admin_rls}"
