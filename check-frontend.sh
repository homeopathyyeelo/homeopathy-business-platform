#!/bin/bash

echo "============================================"
echo "FRONTEND STATUS CHECK"
echo "============================================"
echo ""

# Check if Next.js is running
if pgrep -f "next dev" > /dev/null; then
    echo "✅ Next.js is running"
    PID=$(pgrep -f "next dev" | head -1)
    echo "   PID: $PID"
else
    echo "❌ Next.js is NOT running"
    exit 1
fi

echo ""

# Check if port 3000 is listening
if lsof -i:3000 > /dev/null 2>&1; then
    echo "✅ Port 3000 is listening"
else
    echo "❌ Port 3000 is NOT listening"
    exit 1
fi

echo ""

# Test HTTP response
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Frontend is responding (HTTP $HTTP_CODE)"
else
    echo "❌ Frontend returned HTTP $HTTP_CODE"
    exit 1
fi

echo ""
echo "============================================"
echo "✅ FRONTEND IS WORKING!"
echo "============================================"
echo ""
echo "🌐 Access your application at:"
echo "   http://localhost:3000"
echo ""
echo "📱 Or from your network:"
echo "   http://192.168.1.7:3000"
echo ""
