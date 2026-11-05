#!/usr/bin/env bash
# Live chat (item 22) end to end against a throwaway local database: starts the harness database, applies every
# migration, runs the live_chat_rls.sql checks, then live_chat_integration.mjs, which starts, sends and reads chats
# through the real site code (apps/lexta/lib/chat/server.ts behind POST /api/chat) via the local REST stand in
# (../forms/rpc_shim.mjs), and answers as staff in the database.
# Usage: bash supabase/tests/local/live-chat/run.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_THEN="node --experimental-strip-types --no-warnings '$DIR/live_chat_integration.mjs'" \
  bash "$DIR/../run.sh" "${1:-live_chat_rls}"
