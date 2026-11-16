#!/usr/bin/env bash
# The Field Sales and CSR Tracker phone apps (installable PWAs) in a browser against a throwaway local database:
# manifests, service worker scope, the public install pages, the share panels by role, the install banner, and a
# Chromium installability check. Build the portal for the harness first:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
#   TURBO_FORCE=true pnpm --filter @lexta/portal build
# Usage: PWA_SCREENSHOTS=/some/folder bash supabase/tests/local/pwa/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node '$DIR/browser.mjs'" bash "$DIR/../run.sh" "${1:-__pwa_only__}"
