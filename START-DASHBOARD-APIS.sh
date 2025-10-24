#!/bin/bash
echo "🚀 Starting Dashboard APIs..."

killall -9 api-v2-minimal 2>/dev/null

cd services/api-golang-v2-minimal
if [ ! -f "go.mod" ]; then
  echo "Initializing Go module..."
  go mod init api-v2-minimal
  go get github.com/gin-gonic/gin
fi

echo "Building API server..."
go build -o /tmp/api-v2-minimal main.go

if [ $? -eq 0 ]; then
  echo "Starting server on port 3005..."
  PORT=3005 /tmp/api-v2-minimal > ../../logs/api-v2-minimal.log 2>&1 &
  PID=$!
  echo "Server started with PID: $PID"
  
  sleep 3
  echo "Testing health endpoint..."
  curl -s http://localhost:3005/health | jq
  
  echo ""
  echo "✅ Dashboard APIs running on http://localhost:3005"
  echo "   - /health"
  echo "   - /api/erp/dashboard/summary"
  echo "   - /api/erp/dashboard/stats"
  echo "   - /api/erp/dashboard/activity"
  echo "   - /api/erp/system/health"
  echo "   - /api/erp/analytics/*"
else
  echo "❌ Build failed"
  exit 1
fi
