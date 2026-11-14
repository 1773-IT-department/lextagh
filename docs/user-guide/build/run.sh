#!/usr/bin/env bash
# Screenshots for the staff user guide (docs/user-guide). Uses the local test harness only: a throwaway Postgres with
# every migration (supabase/tests/local/run.sh), the local gateway that stands in for Supabase, and the portal's
# production build. Nothing here talks to the real Supabase project or to any real Lexta domain.
#
# 1. Build the portal for the harness:
#      NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
#      TURBO_FORCE=true pnpm --filter @lexta/portal build
# 2. Take the screenshots (they go to docs/user-guide/images):
#      bash docs/user-guide/build/run.sh
# 3. Make the Word document:
#      python3 docs/user-guide/build/make_docx.py
# The short videos (docs/user-guide/videos) are recorded separately, with both apps built: see record.sh.
# The filter below matches no SQL test file, so only the screenshot script runs once the database is up.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../../.." && pwd)"
HARNESS_THEN="node '$DIR/screenshots.mjs'" bash "$ROOT/supabase/tests/local/run.sh" "no-sql-tests-for-the-guide"
