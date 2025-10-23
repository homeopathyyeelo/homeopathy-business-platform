#!/bin/bash

echo "============================================"
echo "COMPARE: Main Branch vs BUG Branch"
echo "============================================"
echo ""

SOURCE="main-latest-code-homeopathy-business-platform"
CURRENT="."

if [ ! -d "$SOURCE" ]; then
    echo "❌ Error: $SOURCE not found!"
    exit 1
fi

echo "📊 Comparing layout files..."
echo ""

# Compare layout components
echo "=== Layout Components ==="
if [ -d "$SOURCE/components/layout" ] && [ -d "$CURRENT/components/layout" ]; then
    echo "Files in MAIN branch:"
    ls -1 "$SOURCE/components/layout/" | head -20
    echo ""
    echo "Files in BUG branch (current):"
    ls -1 "$CURRENT/components/layout/" | head -20
    echo ""
    
    echo "📝 Differences:"
    diff -q "$SOURCE/components/layout/" "$CURRENT/components/layout/" 2>/dev/null | head -20
else
    echo "⚠️  Layout directory not found in one or both branches"
fi

echo ""
echo "=== App Directory (Pages) ==="
if [ -d "$SOURCE/app" ] && [ -d "$CURRENT/app" ]; then
    echo "Main branch app/ structure:"
    find "$SOURCE/app" -maxdepth 2 -type f -name "*.tsx" -o -name "*.ts" | head -20
    echo ""
    echo "BUG branch app/ structure:"
    find "$CURRENT/app" -maxdepth 2 -type f -name "*.tsx" -o -name "*.ts" | head -20
else
    echo "⚠️  App directory not found in one or both branches"
fi

echo ""
echo "=== Critical Files Comparison ==="

CRITICAL_FILES=(
    "app/layout.tsx"
    "app/page.tsx"
    "next.config.js"
    "tailwind.config.ts"
    "package.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$SOURCE/$file" ] && [ -f "$CURRENT/$file" ]; then
        if diff -q "$SOURCE/$file" "$CURRENT/$file" > /dev/null 2>&1; then
            echo "✅ $file - SAME"
        else
            echo "⚠️  $file - DIFFERENT"
            echo "   Lines in MAIN: $(wc -l < "$SOURCE/$file")"
            echo "   Lines in BUG:  $(wc -l < "$CURRENT/$file")"
        fi
    else
        echo "❌ $file - Missing in one branch"
    fi
done

echo ""
echo "============================================"
echo "📊 Size Comparison"
echo "============================================"
echo ""

echo "MAIN branch size:"
du -sh "$SOURCE" 2>/dev/null

echo "BUG branch size:"
du -sh "$CURRENT" 2>/dev/null | grep -v "^du:"

echo ""
echo "============================================"
echo "💡 Recommendation"
echo "============================================"
echo ""
echo "To fix layout bugs, copy files in this order:"
echo "   1. ✅ First: Individual layout components (test each)"
echo "   2. ✅ Then: App pages one by one"
echo "   3. ✅ Finally: Configuration files"
echo ""
echo "Run: ./copy-from-main-step-by-step.sh"
echo ""
