#!/usr/bin/env bash
# Our Brands and Where to Buy live data (item 20) against a throwaway local database: starts the harness database,
# applies every migration (0001 to the latest, products seeded by 0004), then runs site_data_integration.mjs, which
# reads products, regions and stockists through the real helpers and site code via the local REST stand in.
# Usage: bash supabase/tests/local/site-data/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node --experimental-strip-types --no-warnings '$DIR/site_data_integration.mjs'" \
  bash "$DIR/../run.sh" "${1:-__site_data_only__}"
