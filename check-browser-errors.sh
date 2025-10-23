#!/bin/bash

echo "============================================"
echo "CHECKING BROWSER ERRORS"
echo "============================================"

# Test if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js is NOT running on port 3000"
    exit 1
fi

echo "✅ Next.js is running"
echo ""

# Download the dashboard page
echo "Downloading dashboard page..."
curl -s http://localhost:3000/dashboard > /tmp/dashboard.html

# Extract all script sources
echo ""
echo "Checking all JavaScript files..."
grep -o 'src="[^"]*\.js[^"]*"' /tmp/dashboard.html | sed 's/src="//;s/"//' | while read script; do
    if [[ $script == /* ]]; then
        url="http://localhost:3000$script"
    else
        url="$script"
    fi
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$status" = "200" ]; then
        echo "✅ $script"
    else
        echo "❌ $script (HTTP $status)"
    fi
done

echo ""
echo "Checking CSS files..."
grep -o 'href="[^"]*\.css[^"]*"' /tmp/dashboard.html | sed 's/href="//;s/"//' | while read css; do
    if [[ $css == /* ]]; then
        url="http://localhost:3000$css"
    else
        url="$css"
    fi
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$status" = "200" ]; then
        echo "✅ $css"
    else
        echo "❌ $css (HTTP $status)"
    fi
done

echo ""
echo "============================================"
echo "Checking for syntax errors in compiled JS..."
echo "============================================"

# Check layout.js
if [ -f ".next/static/chunks/app/layout.js" ]; then
    if node -c .next/static/chunks/app/layout.js 2>/dev/null; then
        echo "✅ layout.js - NO SYNTAX ERRORS"
    else
        echo "❌ layout.js - SYNTAX ERROR FOUND"
        node -c .next/static/chunks/app/layout.js 2>&1 | head -10
    fi
else
    echo "❌ layout.js not found"
fi

# Check main-app.js
if [ -f ".next/static/chunks/main-app.js" ]; then
    if node -c .next/static/chunks/main-app.js 2>/dev/null; then
        echo "✅ main-app.js - NO SYNTAX ERRORS"
    else
        echo "❌ main-app.js - SYNTAX ERROR FOUND"
    fi
else
    echo "❌ main-app.js not found"
fi

echo ""
echo "============================================"
echo "SUMMARY"
echo "============================================"
echo "If all checks pass above, open browser and check F12 console"
echo "URL: http://localhost:3000/dashboard"
echo "============================================"
