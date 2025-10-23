#!/bin/bash

echo "============================================"
echo "COPY NEXT.JS FILES SELECTIVELY"
echo "============================================"
echo ""

SOURCE_DIR="main-latest-code-homeopathy-business-platform"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    exit 1
fi

echo "This script helps you copy Next.js files one by one"
echo ""
echo "Available options:"
echo "  1. Copy specific page (e.g., app/dashboard/page.tsx)"
echo "  2. Copy specific component (e.g., components/layout/Header.tsx)"
echo "  3. Copy entire folder (e.g., app/dashboard/)"
echo "  4. Copy lib/ utilities"
echo "  5. Copy hooks/"
echo "  6. Copy contexts/"
echo "  7. Copy all Next.js files (WARNING: will overwrite)"
echo "  8. Exit"
echo ""

while true; do
    read -p "Choose option (1-8): " choice
    
    case $choice in
        1)
            echo ""
            read -p "Enter page path (e.g., app/dashboard/page.tsx): " page_path
            if [ -f "$SOURCE_DIR/$page_path" ]; then
                # Create directory if it doesn't exist
                mkdir -p "$(dirname "$page_path")"
                cp "$SOURCE_DIR/$page_path" "$page_path"
                echo "✅ Copied: $page_path"
            else
                echo "❌ File not found: $SOURCE_DIR/$page_path"
            fi
            ;;
        2)
            echo ""
            read -p "Enter component path (e.g., components/layout/Header.tsx): " comp_path
            if [ -f "$SOURCE_DIR/$comp_path" ]; then
                mkdir -p "$(dirname "$comp_path")"
                cp "$SOURCE_DIR/$comp_path" "$comp_path"
                echo "✅ Copied: $comp_path"
            else
                echo "❌ File not found: $SOURCE_DIR/$comp_path"
            fi
            ;;
        3)
            echo ""
            read -p "Enter folder path (e.g., app/dashboard/): " folder_path
            if [ -d "$SOURCE_DIR/$folder_path" ]; then
                cp -r "$SOURCE_DIR/$folder_path" "$folder_path"
                echo "✅ Copied folder: $folder_path"
            else
                echo "❌ Folder not found: $SOURCE_DIR/$folder_path"
            fi
            ;;
        4)
            echo ""
            echo "Copying lib/ folder..."
            if [ -d "$SOURCE_DIR/lib" ]; then
                # Backup existing
                [ -d "lib" ] && cp -r "lib" "lib.backup.$(date +%Y%m%d-%H%M%S)"
                cp -r "$SOURCE_DIR/lib" .
                echo "✅ lib/ copied (old backed up)"
            else
                echo "❌ lib/ not found in source"
            fi
            ;;
        5)
            echo ""
            echo "Copying hooks/ folder..."
            if [ -d "$SOURCE_DIR/hooks" ]; then
                [ -d "hooks" ] && cp -r "hooks" "hooks.backup.$(date +%Y%m%d-%H%M%S)"
                cp -r "$SOURCE_DIR/hooks" .
                echo "✅ hooks/ copied (old backed up)"
            else
                echo "❌ hooks/ not found in source"
            fi
            ;;
        6)
            echo ""
            echo "Copying contexts/ folder..."
            if [ -d "$SOURCE_DIR/contexts" ]; then
                [ -d "contexts" ] && cp -r "contexts" "contexts.backup.$(date +%Y%m%d-%H%M%S)"
                cp -r "$SOURCE_DIR/contexts" .
                echo "✅ contexts/ copied (old backed up)"
            else
                echo "❌ contexts/ not found in source"
            fi
            ;;
        7)
            echo ""
            echo "⚠️  WARNING: This will overwrite ALL Next.js files!"
            read -p "Are you sure? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                echo "Backing up current files..."
                [ -d "app" ] && cp -r "app" "app.backup.$(date +%Y%m%d-%H%M%S)"
                [ -d "components" ] && cp -r "components" "components.backup.$(date +%Y%m%d-%H%M%S)"
                [ -d "lib" ] && cp -r "lib" "lib.backup.$(date +%Y%m%d-%H%M%S)"
                [ -d "hooks" ] && cp -r "hooks" "hooks.backup.$(date +%Y%m%d-%H%M%S)"
                [ -d "contexts" ] && cp -r "contexts" "contexts.backup.$(date +%Y%m%d-%H%M%S)"
                
                echo "Copying all Next.js files..."
                [ -d "$SOURCE_DIR/app" ] && cp -r "$SOURCE_DIR/app" .
                [ -d "$SOURCE_DIR/components" ] && cp -r "$SOURCE_DIR/components" .
                [ -d "$SOURCE_DIR/lib" ] && cp -r "$SOURCE_DIR/lib" .
                [ -d "$SOURCE_DIR/hooks" ] && cp -r "$SOURCE_DIR/hooks" .
                [ -d "$SOURCE_DIR/contexts" ] && cp -r "$SOURCE_DIR/contexts" .
                
                echo "✅ All Next.js files copied (old backed up)"
            else
                echo "❌ Cancelled"
            fi
            ;;
        8)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "❌ Invalid option"
            ;;
    esac
    
    echo ""
    echo "---"
    echo ""
done
