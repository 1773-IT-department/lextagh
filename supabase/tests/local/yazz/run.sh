#!/usr/bin/env bash
# The Yazz brand site against a throwaway local database: starts the harness database, applies every migration, then
#   yazz_integration.mjs  the site's own server code (forms, products, Where to Buy, live chat) through the local REST
#                         stand in: every form lands a Yazz lead or complaint, reads return Yazz data only
#   browser.mjs           the production build in a browser at 390 and 1440 px: every page, Yazz data only, forms with
#                         and without JavaScript, the chat widget, screenshots of every page
# No SQL test file matches the filter, so only these run. Build the site for the harness first:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
#   pnpm --filter @lexta/yazz build
# browser.mjs runs first: it loads the demo seed, whose fixed records need an empty database.
# Usage: YAZZ_SCREENSHOTS=/some/folder bash supabase/tests/local/yazz/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node '$DIR/browser.mjs' && node --experimental-strip-types --no-warnings '$DIR/yazz_integration.mjs'" \
  bash "$DIR/../run.sh" "${1:-__yazz_only__}"
