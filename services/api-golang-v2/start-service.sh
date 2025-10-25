#!/bin/bash

# Start API Golang V2 Service
# This service runs on port 3005 and provides all ERP APIs

SERVICE_NAME="API Golang V2"
PORT=3005
LOG_FILE="/tmp/api-golang-v2.log"

echo "🚀 Starting $SERVICE_NAME..."

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $PORT is already in use. Stopping existing process..."
    lsof -ti :$PORT | xargs -r kill -9
    sleep 2
fi

# Start the service
cd "$(dirname "$0")"
nohup go run cmd/main.go > "$LOG_FILE" 2>&1 &

echo "⏳ Waiting for service to start..."
sleep 3

# Check if service started successfully
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ $SERVICE_NAME started successfully on port $PORT"
    echo "📋 Logs: tail -f $LOG_FILE"
    echo "🌐 Test: curl http://localhost:$PORT/health"
else
    echo "❌ Failed to start $SERVICE_NAME"
    echo "📋 Check logs: cat $LOG_FILE"
    exit 1
fi
