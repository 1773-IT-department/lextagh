#!/usr/bin/env bash
# The Lexta dropdown (packages/ui Select) on the website and in the portal, in a browser against a throwaway local
# database: starts the harness database, applies every migration, then browser.mjs (see its header). No SQL test file
# matches the filter, so only the browser check runs. Build both apps for the harness first:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
#   NEXT_PUBLIC_PORTAL_URL=http://127.0.0.1:3101 TURBO_FORCE=true pnpm build
# Usage: DROPDOWN_SCREENSHOTS=/some/folder bash supabase/tests/local/dropdowns/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node '$DIR/component.mjs' && node '$DIR/browser.mjs'" bash "$DIR/../run.sh" "${1:-__dropdowns_only__}"
