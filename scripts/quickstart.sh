#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[1/5] Starting core infra and services (kafka-ui disabled)..."
docker compose -f "$ROOT_DIR/docker-compose.dev.yml" up -d --remove-orphans --scale kafka-ui=0

echo "[2/5] Installing DB deps, generating Prisma client, migrating, and seeding..."
pushd "$ROOT_DIR/packages/shared-db" >/dev/null
npm ci --no-audit --fund=false --progress=false
npx prisma generate
npx prisma migrate deploy
npm run seed
popd >/dev/null

echo "[3/5] Install root deps if needed (frontend/dev) and launch dev servers"
if [ -f "$ROOT_DIR/package.json" ]; then
  pushd "$ROOT_DIR" >/dev/null
  npm ci --no-audit --fund=false --progress=false || true
  popd >/dev/null
fi

echo "- AI service health check..."
curl -fsS http://localhost:8001/health || true

echo "[4/5] Start Next.js on PORT=4000 (skip if already running)"
if ! nc -z localhost 4000 >/dev/null 2>&1; then
  echo "Starting Next.js dev server on :4000 in background..."
  (cd "$ROOT_DIR" && PORT=4000 npm run dev >/dev/null 2>&1 &)
  sleep 5 || true
fi

echo "- Start NestJS API in background if repo contains it (skip if already running)"
if [ -d "$ROOT_DIR/services/api-nest" ]; then
  if ! nc -z localhost 5001 >/dev/null 2>&1; then
    (cd "$ROOT_DIR/services/api-nest" && npm ci --no-audit --fund=false --progress=false && npm run start:dev >/dev/null 2>&1 &) 
    sleep 4 || true
  fi
fi

echo "[5/5] Smoke tests"
echo "- AI models list"
curl -fsS http://localhost:8001/v1/models || true
echo
echo "- AI embed test"
curl -fsS -X POST http://localhost:8001/v1/embed -H 'content-type: application/json' -d '{"texts":["hello homeopathy"]}' || true
echo
echo "- Frontend status (HTTP 200 expected):"
curl -fsS -o /dev/null -w "%{http_code}\n" http://localhost:4000 || true
if [ -d "$ROOT_DIR/services/api-nest" ]; then
  echo "- API Nest ping (if route exists):"
  curl -fsS -o /dev/null -w "%{http_code}\n" http://localhost:5001 || true
fi
echo "All done. Frontend at http://localhost:4000"


