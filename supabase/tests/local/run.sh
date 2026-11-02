#!/usr/bin/env bash
# Local SQL test harness for the Lexta database.
# Starts a throwaway Postgres, loads a minimal Supabase stub (auth, storage, API roles),
# applies every migration in supabase/migrations in order, then runs every supabase/tests/*.sql file.
# Nothing here talks to the real Supabase project.
#
# Usage: bash supabase/tests/local/run.sh            (all tests)
#        bash supabase/tests/local/run.sh products_rls (only tests whose file name contains the word)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
FILTER="${1:-}"
PORT="${PGTEST_PORT:-54329}"

find_pg_bin() {
  if command -v pg_config >/dev/null 2>&1 && [ -x "$(pg_config --bindir)/initdb" ]; then pg_config --bindir; return; fi
  ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -n 1
}

PG_BIN="$(find_pg_bin || true)"
if [ -z "$PG_BIN" ] || [ ! -x "$PG_BIN/initdb" ]; then
  echo "Postgres not found, installing it with apt"
  apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql >/dev/null
  PG_BIN="$(find_pg_bin)"
fi

WORK="$(mktemp -d)"
DATA="$WORK/data"
SOCK="$WORK/sock"
mkdir -p "$SOCK"

# initdb refuses to run as root, so use the postgres system user when we are root.
RUN=()
if [ "$(id -u)" = "0" ]; then
  id postgres >/dev/null 2>&1 || useradd --system --no-create-home postgres
  chown -R postgres "$WORK"
  RUN=(runuser -u postgres --)
fi

cleanup() {
  "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

"${RUN[@]}" "$PG_BIN/initdb" -D "$DATA" -U postgres -A trust --no-sync >/dev/null
"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA" -l "$WORK/postgres.log" -w \
  -o "-p $PORT -k $SOCK -c listen_addresses='' -c fsync=off" start >/dev/null

PSQL=("$PG_BIN/psql" -h "$SOCK" -p "$PORT" -U postgres -d postgres -X -q -v ON_ERROR_STOP=1)

echo "Loading Supabase stub"
"${PSQL[@]}" -f "$ROOT/supabase/tests/local/supabase_stub.sql"

for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "Applying $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

failed=0
ran=0
for t in "$ROOT"/supabase/tests/*.sql; do
  [ -e "$t" ] || continue
  if [ -n "$FILTER" ] && [[ "$(basename "$t")" != *"$FILTER"* ]]; then continue; fi
  ran=$((ran + 1))
  echo "Running $(basename "$t")"
  set +e
  "${PSQL[@]}" -f "$t" 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
  status="${PIPESTATUS[0]}"
  set -e
  if [ "$status" != "0" ]; then failed=$((failed + 1)); echo "FAILED: $(basename "$t")"; fi
done

if [ "$ran" = "0" ]; then echo "No test files matched"; exit 1; fi
if [ "$failed" != "0" ]; then echo "$failed of $ran test files failed"; exit 1; fi
echo "All $ran test files passed"
