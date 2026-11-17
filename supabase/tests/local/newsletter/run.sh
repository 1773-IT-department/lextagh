#!/usr/bin/env bash
# Newsletter unsubscribe (Drive requests P4) in a browser at 390 and 1440 px, against a throwaway local database:
# starts the harness database, applies every migration, then browser.mjs: the Lexta site's /unsubscribe page in every
# state, with and without JavaScript, and the portal's CRM contacts "Newsletter" filter. Build both apps first:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
#   pnpm --filter @lexta/web --filter @lexta/portal build
# Usage: NEWSLETTER_SCREENSHOTS=/some/folder bash supabase/tests/local/newsletter/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node '$DIR/browser.mjs'" bash "$DIR/../run.sh" "${1:-__newsletter_only__}"
