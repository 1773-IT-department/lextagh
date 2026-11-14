#!/usr/bin/env bash
# The Hooch brand site against a throwaway local database: starts the harness database, applies every migration, then
#   hooch_integration.mjs the site's own server code (forms, products, Where to Buy, live chat) through the local REST
#                          stand in: every form lands a Hooch lead or complaint, reads return Hooch data only
#   browser.mjs           the production build in a browser at 390 and 1440 px: every page, Hooch data only, forms with
#                         and without JavaScript, the chat widget, screenshots of every page
# No SQL test file matches the filter, so only these run. Build the site for the harness first:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
#   pnpm --filter @lexta/hooch build
# browser.mjs runs first: it loads the demo seed, whose fixed records need an empty database.
# Usage: HOOCH_SCREENSHOTS=/some/folder bash supabase/tests/local/hooch/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node '$DIR/browser.mjs' && node --experimental-strip-types --no-warnings '$DIR/hooch_integration.mjs'" \
  bash "$DIR/../run.sh" "${1:-__hooch_only__}"
