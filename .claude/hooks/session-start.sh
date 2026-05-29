#!/bin/bash
# SessionStart hook: install dependencies so `pnpm check` and the test suite
# work immediately in fresh Claude Code on the web containers.
set -euo pipefail

# Only run in remote (web) environments — local sessions manage their own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

corepack enable >/dev/null 2>&1 || true

cd "${CLAUDE_PROJECT_DIR:-.}"
pnpm install --frozen-lockfile
