#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[dev] Ensure root deps installed"
if [ -f "$ROOT_DIR/package.json" ]; then
  pushd "$ROOT_DIR" >/dev/null
  npm ci --no-audit --fund=false --progress=false || true
  popd >/dev/null
fi

echo "[dev] Start Next.js (PORT=4000) if not running"
if ! nc -z localhost 4000 >/dev/null 2>&1; then
  (cd "$ROOT_DIR" && PORT=4000 npx next dev >/tmp/next-dev.log 2>&1 &) 
  echo "- Next.js starting on http://localhost:4000 (logs: /tmp/next-dev.log)"
  sleep 3 || true
fi

if [ -d "$ROOT_DIR/services/api-nest" ]; then
  echo "[dev] Start NestJS API if not running"
  if ! pgrep -f "node.*nest" >/dev/null 2>&1 && ! nc -z localhost 5001 >/dev/null 2>&1; then
    (cd "$ROOT_DIR/services/api-nest" && npm ci --no-audit --fund=false --progress=false && npm run start:dev >/tmp/nest-dev.log 2>&1 &)
    echo "- NestJS dev running (logs: /tmp/nest-dev.log)"
    sleep 3 || true
  fi
fi

echo "[dev] Check endpoints"
echo "- Frontend status code:"; curl -fsS -o /dev/null -w "%{http_code}\n" http://localhost:4000 || true
echo "- AI health:"; curl -fsS http://localhost:8001/health || true
if [ -d "$ROOT_DIR/services/api-nest" ]; then
  echo "- API (may not expose root path):"; curl -fsS -o /dev/null -w "%{http_code}\n" http://localhost:5001 || true
fi

echo "[dev] Hot reload ready. Edit files and changes auto-apply."

