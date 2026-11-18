#!/usr/bin/env bash
# Lists the apps (lexta portal yazz linzzy hooch) whose files changed between two commits.
# Shared files (packages/, lockfile, root package.json, turbo.json) count for every app.
# Usage: bash scripts/changed-apps.sh <from sha> [to sha, default HEAD]
set -euo pipefail
from="${1:?usage: changed-apps.sh <from sha> [to sha]}"
to="${2:-HEAD}"
files="$(git diff --name-only "$from" "$to")"
if grep -qE '^(packages/|pnpm-lock\.yaml$|package\.json$|turbo\.json$)' <<<"$files"; then
  echo "lexta portal yazz linzzy hooch"
  exit 0
fi
out=()
for app in lexta portal yazz linzzy hooch; do
  if grep -q "^apps/$app/" <<<"$files"; then out+=("$app"); fi
done
echo "${out[*]:-}"
