#!/usr/bin/env bash
# Website forms (item 19) end to end against a throwaway local database: starts the harness database, applies every
# migration, then runs forms_integration.mjs, which submits each form through apps/lexta/lib/forms/core.ts.
# Usage: bash supabase/tests/local/forms/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node --experimental-strip-types --no-warnings '$DIR/forms_integration.mjs'" \
  bash "$DIR/../run.sh" "${1:-__forms_only__}"
