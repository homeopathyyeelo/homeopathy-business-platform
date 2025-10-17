#!/bin/bash

# Stop All Microservices

echo "🛑 Stopping all microservices..."

if [ -f .api-pids ]; then
    PIDS=$(cat .api-pids)
    for PID in $PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "Stopping process $PID..."
            kill $PID
        fi
    done
    rm .api-pids
    echo "✅ All services stopped"
else
    echo "⚠️  No PID file found. Killing by port..."
    # Fallback: kill by port
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    lsof -ti:3003 | xargs kill -9 2>/dev/null || true
    lsof -ti:3004 | xargs kill -9 2>/dev/null || true
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
    echo "✅ Services stopped by port"
fi
