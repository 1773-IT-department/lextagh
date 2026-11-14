#!/usr/bin/env bash
# Careers page and recruitment intake (item 21) end to end against a throwaway local database: starts the harness
# database, applies every migration, then runs recruitment_integration.mjs, which reads open roles and sends
# applications with CVs through the real site code (apps/lexta/lib/forms/careers.ts, components/careers/live.ts) via
# the local REST and Storage stand in (../forms/rpc_shim.mjs).
# Usage: bash supabase/tests/local/recruitment/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node --experimental-strip-types --no-warnings '$DIR/recruitment_integration.mjs'" \
  bash "$DIR/../run.sh" "${1:-__recruitment_only__}"
