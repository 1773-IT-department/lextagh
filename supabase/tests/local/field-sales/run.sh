#!/usr/bin/env bash
# Field sales (item 24) in a browser against a throwaway local database: starts the harness database, applies every
# migration, runs the field_sales_rls.sql checks, then browser.mjs, which starts the gateway and the portal's
# production build and drives the rep flow at 390 px and the manager view at 1440 px.
# Build the portal for the harness first:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
#   TURBO_FORCE=true pnpm --filter @lexta/portal build
# Usage: FIELD_SCREENSHOTS=/some/folder bash supabase/tests/local/field-sales/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node '$DIR/browser.mjs'" bash "$DIR/../run.sh" "${1:-field_sales_rls}"
