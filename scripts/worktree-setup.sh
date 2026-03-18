#!/usr/bin/env bash
set -euo pipefail

# Bootstrap a worktree/temp copy of the project to run on port 3099.
#
# Usage:
#   bash scripts/worktree-setup.sh <main-repo-path>
#
# Example (from a worktree):
#   bash scripts/worktree-setup.sh /home/denimar/projects/personal/stacktalk

MAIN_REPO="${1:-}"
WORKTREE_DIR="$(pwd)"

if [ -z "$MAIN_REPO" ]; then
  # Try auto-detect from git worktree metadata
  if [ -f "$WORKTREE_DIR/.git" ]; then
    MAIN_REPO="$(cd "$WORKTREE_DIR" && git rev-parse --git-common-dir 2>/dev/null | xargs realpath 2>/dev/null | sed 's|/\.git$||' || true)"
  fi
fi

if [ -z "$MAIN_REPO" ]; then
  echo "Usage: bash scripts/worktree-setup.sh <main-repo-path>"
  echo "ERROR: Could not determine main repo path. Pass it as first argument."
  exit 1
fi

if [ ! -d "$MAIN_REPO/node_modules" ]; then
  echo "ERROR: Main repo node_modules not found at $MAIN_REPO/node_modules"
  exit 1
fi

echo "=== Worktree Bootstrap ==="
echo "Main repo: $MAIN_REPO"
echo "Worktree:  $WORKTREE_DIR"

# 1. Symlink node_modules
if [ ! -e "$WORKTREE_DIR/node_modules" ]; then
  echo "[1/5] Symlinking node_modules..."
  ln -s "$MAIN_REPO/node_modules" "$WORKTREE_DIR/node_modules"
else
  echo "[1/5] node_modules exists, skipping."
fi

# 2. Copy .env
if [ ! -f "$WORKTREE_DIR/.env" ]; then
  if [ -f "$MAIN_REPO/.env" ]; then
    echo "[2/5] Copying .env..."
    cp "$MAIN_REPO/.env" "$WORKTREE_DIR/.env"
  else
    echo "[2/5] WARNING: No .env in main repo, skipping."
  fi
else
  echo "[2/5] .env exists, skipping."
fi

# 3. Symlink generated Prisma client
PRISMA_GENERATED="$WORKTREE_DIR/src/generated/prisma"
if [ ! -e "$PRISMA_GENERATED" ]; then
  if [ -d "$MAIN_REPO/src/generated/prisma" ]; then
    echo "[3/5] Symlinking Prisma generated client..."
    mkdir -p "$(dirname "$PRISMA_GENERATED")"
    ln -s "$MAIN_REPO/src/generated/prisma" "$PRISMA_GENERATED"
  else
    echo "[3/5] WARNING: No Prisma client in main repo, skipping."
  fi
else
  echo "[3/5] Prisma client exists, skipping."
fi

# 4. Kill any existing process on port 3099
if lsof -i :3099 -t >/dev/null 2>&1; then
  echo "[4/5] Killing existing process on port 3099..."
  kill $(lsof -i :3099 -t) 2>/dev/null || true
  sleep 1
else
  echo "[4/5] Port 3099 is free."
fi

# 5. Start dev server on port 3099 (use webpack — Turbopack rejects external symlinks)
echo "[5/5] Starting dev server on port 3099 (webpack mode)..."
PORT=3099 npx next dev --webpack > /tmp/stacktalk-worktree-dev.log 2>&1 &
DEV_PID=$!
echo "Dev server PID: $DEV_PID"
echo "$DEV_PID" > /tmp/stacktalk-worktree-dev.pid

# Poll until server is ready (max 90s — first compile can be slow)
echo "Waiting for server to be ready..."
TIMEOUT=90
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3099 2>/dev/null | grep -qE "^[23]"; then
    echo ""
    echo "=== Server ready on http://localhost:3099 (${ELAPSED}s) ==="
    exit 0
  fi
  printf "."
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

echo ""
echo "ERROR: Server did not start within ${TIMEOUT}s."
echo "Last 20 lines of log:"
tail -20 /tmp/stacktalk-worktree-dev.log 2>/dev/null || true
kill $DEV_PID 2>/dev/null || true
exit 1
