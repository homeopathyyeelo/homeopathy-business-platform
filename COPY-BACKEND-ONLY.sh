#!/bin/bash

echo "============================================"
echo "COPYING BACKEND FILES ONLY"
echo "============================================"
echo ""

SOURCE_DIR="main-latest-code-homeopathy-business-platform"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    exit 1
fi

echo "📋 This will copy ONLY backend and config files"
echo "✅ Will NOT touch: app/, components/, lib/, hooks/, contexts/"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "🔄 Starting copy process..."
echo ""

# 1. Copy services folder (all backend services)
echo "1️⃣ Copying services/ folder..."
if [ -d "$SOURCE_DIR/services" ]; then
    cp -r "$SOURCE_DIR/services" .
    echo "✅ Services copied"
else
    echo "⚠️  services/ not found in source"
fi

# 2. Copy database files
echo ""
echo "2️⃣ Copying database files..."
if [ -d "$SOURCE_DIR/db" ]; then
    cp -r "$SOURCE_DIR/db" .
    echo "✅ Database files copied"
else
    echo "⚠️  db/ not found in source"
fi

# 3. Copy config files
echo ""
echo "3️⃣ Copying config files..."
if [ -d "$SOURCE_DIR/config" ]; then
    cp -r "$SOURCE_DIR/config" .
    echo "✅ Config files copied"
else
    echo "⚠️  config/ not found in source"
fi

if [ -d "$SOURCE_DIR/configs" ]; then
    cp -r "$SOURCE_DIR/configs" .
    echo "✅ Configs files copied"
else
    echo "⚠️  configs/ not found in source"
fi

# 4. Copy Docker files
echo ""
echo "4️⃣ Copying Docker files..."
[ -f "$SOURCE_DIR/docker-compose.yml" ] && cp "$SOURCE_DIR/docker-compose.yml" . && echo "✅ docker-compose.yml"
[ -f "$SOURCE_DIR/Dockerfile" ] && cp "$SOURCE_DIR/Dockerfile" . && echo "✅ Dockerfile"
[ -f "$SOURCE_DIR/Dockerfile.nextjs" ] && cp "$SOURCE_DIR/Dockerfile.nextjs" . && echo "✅ Dockerfile.nextjs"
[ -f "$SOURCE_DIR/.dockerignore" ] && cp "$SOURCE_DIR/.dockerignore" . && echo "✅ .dockerignore"

# 5. Copy scripts
echo ""
echo "5️⃣ Copying scripts..."
[ -f "$SOURCE_DIR/Makefile" ] && cp "$SOURCE_DIR/Makefile" . && echo "✅ Makefile"
[ -f "$SOURCE_DIR/Makefile.complete" ] && cp "$SOURCE_DIR/Makefile.complete" . && echo "✅ Makefile.complete"

# Copy shell scripts (but not the ones we're creating now)
for script in "$SOURCE_DIR"/*.sh; do
    if [ -f "$script" ]; then
        filename=$(basename "$script")
        if [[ "$filename" != "COPY-BACKEND-ONLY.sh" ]]; then
            cp "$script" .
            chmod +x "$filename"
            echo "✅ $filename"
        fi
    fi
done

# 6. Copy package.json and related files (but NOT node_modules)
echo ""
echo "6️⃣ Copying package files..."
[ -f "$SOURCE_DIR/package.json" ] && cp "$SOURCE_DIR/package.json" . && echo "✅ package.json"
[ -f "$SOURCE_DIR/package-lock.json" ] && cp "$SOURCE_DIR/package-lock.json" . && echo "✅ package-lock.json"
[ -f "$SOURCE_DIR/turbo.json" ] && cp "$SOURCE_DIR/turbo.json" . && echo "✅ turbo.json"
[ -f "$SOURCE_DIR/tsconfig.json" ] && cp "$SOURCE_DIR/tsconfig.json" . && echo "✅ tsconfig.json"

# 7. Copy public folder
echo ""
echo "7️⃣ Copying public/ folder..."
if [ -d "$SOURCE_DIR/public" ]; then
    cp -r "$SOURCE_DIR/public" .
    echo "✅ Public files copied"
else
    echo "⚠️  public/ not found in source"
fi

# 8. Copy documentation
echo ""
echo "8️⃣ Copying documentation..."
if [ -d "$SOURCE_DIR/docs" ]; then
    cp -r "$SOURCE_DIR/docs" .
    echo "✅ Documentation copied"
else
    echo "⚠️  docs/ not found in source"
fi

# Copy markdown files
for md in "$SOURCE_DIR"/*.md; do
    if [ -f "$md" ]; then
        filename=$(basename "$md")
        cp "$md" .
        echo "✅ $filename"
    fi
done

# 9. Copy .env files (but keep your existing ones as backup)
echo ""
echo "9️⃣ Copying environment files..."
if [ -f "$SOURCE_DIR/.env" ]; then
    [ -f ".env" ] && cp ".env" ".env.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$SOURCE_DIR/.env" .
    echo "✅ .env copied (old backed up)"
fi

if [ -f "$SOURCE_DIR/.env.local" ]; then
    [ -f ".env.local" ] && cp ".env.local" ".env.local.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$SOURCE_DIR/.env.local" .
    echo "✅ .env.local copied (old backed up)"
fi

# 10. Copy other root files
echo ""
echo "🔟 Copying other root files..."
[ -f "$SOURCE_DIR/.gitignore" ] && cp "$SOURCE_DIR/.gitignore" . && echo "✅ .gitignore"
[ -f "$SOURCE_DIR/.prettierrc" ] && cp "$SOURCE_DIR/.prettierrc" . && echo "✅ .prettierrc"
[ -f "$SOURCE_DIR/.eslintrc.json" ] && cp "$SOURCE_DIR/.eslintrc.json" . && echo "✅ .eslintrc.json"

echo ""
echo "============================================"
echo "✅ BACKEND FILES COPIED SUCCESSFULLY!"
echo "============================================"
echo ""
echo "📋 What was copied:"
echo "  ✅ services/ (all backend services)"
echo "  ✅ db/ (database migrations)"
echo "  ✅ config/ & configs/"
echo "  ✅ Docker files"
echo "  ✅ Scripts (.sh files)"
echo "  ✅ package.json & related"
echo "  ✅ public/"
echo "  ✅ docs/"
echo "  ✅ .env files (old backed up)"
echo "  ✅ Other config files"
echo ""
echo "📋 What was NOT touched:"
echo "  ✅ app/ (Next.js pages)"
echo "  ✅ components/ (React components)"
echo "  ✅ lib/ (utilities)"
echo "  ✅ hooks/ (React hooks)"
echo "  ✅ contexts/ (React contexts)"
echo ""
echo "🎯 Next steps:"
echo "  1. npm install (to update dependencies)"
echo "  2. Check services are working"
echo "  3. Then copy Next.js files one by one if needed"
echo ""
