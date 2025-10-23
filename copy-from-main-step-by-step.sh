#!/bin/bash

echo "============================================"
echo "COPY FROM MAIN BRANCH - Step by Step"
echo "============================================"
echo ""

# Source folder (main branch)
SOURCE="main-latest-code-homeopathy-business-platform"
# Current folder (BUG branch)
CURRENT="."

# Check if source exists
if [ ! -d "$SOURCE" ]; then
    echo "❌ Error: $SOURCE folder not found!"
    exit 1
fi

echo "📁 Source: $SOURCE (main branch - has bugs)"
echo "📁 Target: Current directory (BUG branch - working)"
echo ""
echo "⚠️  IMPORTANT: We'll copy files ONE BY ONE to avoid breaking things"
echo ""

# Function to copy a file safely
copy_file() {
    local file=$1
    local source_file="$SOURCE/$file"
    local target_file="$CURRENT/$file"
    
    if [ ! -f "$source_file" ]; then
        echo "   ⚠️  File not found in source: $file"
        return 1
    fi
    
    # Backup current file if it exists
    if [ -f "$target_file" ]; then
        cp "$target_file" "$target_file.backup-$(date +%Y%m%d-%H%M%S)"
        echo "   💾 Backed up: $file"
    fi
    
    # Copy the file
    cp "$source_file" "$target_file"
    echo "   ✅ Copied: $file"
}

# Function to copy a directory safely
copy_directory() {
    local dir=$1
    local source_dir="$SOURCE/$dir"
    local target_dir="$CURRENT/$dir"
    
    if [ ! -d "$source_dir" ]; then
        echo "   ⚠️  Directory not found in source: $dir"
        return 1
    fi
    
    # Backup current directory if it exists
    if [ -d "$target_dir" ]; then
        mv "$target_dir" "$target_dir.backup-$(date +%Y%m%d-%H%M%S)"
        echo "   💾 Backed up: $dir/"
    fi
    
    # Copy the directory
    cp -r "$source_dir" "$target_dir"
    echo "   ✅ Copied: $dir/"
}

echo "============================================"
echo "STEP 1: Copy Critical Layout Files"
echo "============================================"
echo ""

# Ask user confirmation
read -p "Copy layout files from main branch? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Skipped."
else
    echo "Copying layout components..."
    copy_directory "components/layout"
    echo ""
fi

echo "============================================"
echo "STEP 2: Copy App Directory (Next.js Pages)"
echo "============================================"
echo ""

read -p "Copy app/ directory from main branch? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Skipped."
else
    echo "⚠️  WARNING: This will replace ALL pages!"
    read -p "Are you SURE? (yes/no): " confirm2
    if [ "$confirm2" = "yes" ]; then
        echo "Copying app directory..."
        copy_directory "app"
        echo ""
    else
        echo "Skipped."
    fi
fi

echo "============================================"
echo "STEP 3: Copy Individual Critical Files"
echo "============================================"
echo ""

# List of critical files to copy one by one
CRITICAL_FILES=(
    "app/layout.tsx"
    "app/page.tsx"
    "tailwind.config.ts"
    "next.config.js"
    "tsconfig.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    read -p "Copy $file? (y/n): " confirm
    if [ "$confirm" = "y" ]; then
        copy_file "$file"
    else
        echo "   ⏭️  Skipped: $file"
    fi
    echo ""
done

echo "============================================"
echo "STEP 4: Copy Library Files"
echo "============================================"
echo ""

read -p "Copy lib/ directory? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Skipped."
else
    echo "Copying lib directory..."
    copy_directory "lib"
    echo ""
fi

echo "============================================"
echo "STEP 5: Copy Context Files"
echo "============================================"
echo ""

read -p "Copy contexts/ directory? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Skipped."
else
    echo "Copying contexts directory..."
    copy_directory "contexts"
    echo ""
fi

echo "============================================"
echo "✅ COPY PROCESS COMPLETE"
echo "============================================"
echo ""
echo "📝 What to do next:"
echo "   1. Test the application: npm run dev"
echo "   2. Check for errors in browser console (F12)"
echo "   3. If broken, restore from backups:"
echo "      ls -la *.backup-*"
echo "      mv file.backup-TIMESTAMP file"
echo ""
echo "💡 Tip: Copy files gradually and test after each step!"
echo ""
