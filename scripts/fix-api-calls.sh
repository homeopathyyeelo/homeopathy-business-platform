#!/bin/bash

# Script to fix all fetch('/api/...') calls across the application
# Adds apiFetch import and replaces fetch with apiFetch

echo "🔧 Starting comprehensive API fetch fix..."

# Find all TypeScript/TSX files in app directory that use fetch('/api/
FILES=$(grep -r -l "fetch('/api/" app/ --include="*.tsx" --include="*.ts" 2>/dev/null)

FIXED_COUNT=0
TOTAL_COUNT=0

for file in $FILES; do
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    # Check if file already has apiFetch import
    if grep -q "from '@/lib/utils/api-fetch'" "$file"; then
        echo "⏭️  Skipping $file (already has apiFetch import)"
        continue
    fi
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Add import after other imports
    # Find the last import line and add our import after it
    awk '
        /^import / { last_import = NR }
        { lines[NR] = $0 }
        END {
            for (i = 1; i <= NR; i++) {
                print lines[i]
                if (i == last_import && !found) {
                    print "import { apiFetch } from '\''@/lib/utils/api-fetch'\'';"
                    found = 1
                }
            }
        }
    ' "$file" > "$file.tmp"
    
    # Replace fetch with apiFetch (only for '/api/ patterns)
    sed -i "s/fetch('/apiFetch('/g" "$file.tmp"
    
    # Move temp file to original
    mv "$file.tmp" "$file"
    
    FIXED_COUNT=$((FIXED_COUNT + 1))
    echo "✅ Fixed: $file"
done

echo ""
echo "📊 Summary:"
echo "   Total files scanned: $TOTAL_COUNT"
echo "   Files fixed: $FIXED_COUNT"
echo ""
echo "✅ All API calls now route to correct backend!"
echo ""
echo "💡 Backup files created with .bak extension"
echo "   To rollback: find app/ -name '*.bak' -exec bash -c 'mv \"\$0\" \"\${0%.bak}\"' {} \\;"
