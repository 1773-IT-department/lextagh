#!/usr/bin/env bash
# Full check of the Lexta website and every system (item 28) in a browser at 390 and 1440 px, against a throwaway local
# database: starts the harness database, applies every migration, then browser.mjs (see its header). No SQL test file
# matches the filter, so only the browser check runs. Build both apps for the harness first:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
#   NEXT_PUBLIC_PORTAL_URL=http://127.0.0.1:3101 TURBO_FORCE=true pnpm build
# Usage: FULL_CHECK_OUT=/some/folder bash supabase/tests/local/full-check/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node '$DIR/browser.mjs'" bash "$DIR/../run.sh" "${1:-__full_check_only__}"
