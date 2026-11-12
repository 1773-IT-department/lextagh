#!/usr/bin/env bash
# Short screen recordings for the staff user guide (docs/user-guide/videos). Uses the local test harness only: a
# throwaway Postgres with every migration (supabase/tests/local/run.sh), the local gateway that stands in for Supabase,
# and the production builds of the Lexta site and the portal. Nothing here talks to the real Supabase project, the
# Vercel previews or any real Lexta domain.
#
# 1. Build both apps for the harness (the ports must match the REC_*_PORT values below; these are the defaults):
#      NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
#      NEXT_PUBLIC_PORTAL_URL=http://127.0.0.1:3101 TURBO_FORCE=true pnpm build
# 2. Record (MP4 with ffmpeg, else WebM, into docs/user-guide/videos):
#      bash docs/user-guide/build/record.sh
#    Only some videos:  REC_ONLY=02,05 bash docs/user-guide/build/record.sh
#    Other ports (if another harness is running), with a build made for them:
#      REC_GATEWAY_PORT=54461 REC_SITE_PORT=3160 REC_PORTAL_PORT=3161 bash docs/user-guide/build/record.sh
# The filter below matches no SQL test file, so only the recorder runs once the database is up.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../../.." && pwd)"
HARNESS_THEN="node '$DIR/recordings.mjs'" bash "$ROOT/supabase/tests/local/run.sh" "no-sql-tests-for-the-guide-videos"
