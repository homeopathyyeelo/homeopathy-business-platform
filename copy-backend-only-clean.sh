#!/bin/bash

echo "============================================"
echo "COPY BACKEND ONLY (Exclude Next.js)"
echo "============================================"
echo ""

# Destination folder
DEST="/tmp/homeoerp-backend-only"

# Remove old destination if exists
if [ -d "$DEST" ]; then
    echo "🗑️  Removing old backup..."
    rm -rf "$DEST"
fi

# Create destination
mkdir -p "$DEST"

echo "📦 Copying backend services and infrastructure..."
echo ""

# Copy backend services
echo "✅ Copying services/"
rsync -av --progress \
    --exclude='node_modules' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='.turbo' \
    --exclude='dist' \
    --exclude='build' \
    services/ "$DEST/services/"

# Copy database files
echo "✅ Copying db/"
cp -r db/ "$DEST/db/" 2>/dev/null || echo "   (db folder not found, skipping)"

# Copy config files
echo "✅ Copying config/"
cp -r config/ "$DEST/config/" 2>/dev/null || echo "   (config folder not found, skipping)"

# Copy Docker files
echo "✅ Copying Docker files"
cp docker-compose.yml "$DEST/" 2>/dev/null || echo "   (docker-compose.yml not found)"
cp Dockerfile "$DEST/" 2>/dev/null || echo "   (Dockerfile not found)"

# Copy scripts
echo "✅ Copying scripts"
cp start-complete.sh "$DEST/" 2>/dev/null
cp stop-complete.sh "$DEST/" 2>/dev/null
cp start-simple.sh "$DEST/" 2>/dev/null
cp stop-simple.sh "$DEST/" 2>/dev/null

# Copy documentation (excluding Next.js specific)
echo "✅ Copying documentation"
cp README.md "$DEST/" 2>/dev/null
cp MONOREPO-STRUCTURE.md "$DEST/" 2>/dev/null
cp ARCHITECTURE-POLYGLOT-SERVICES.md "$DEST/" 2>/dev/null

# Copy environment files
echo "✅ Copying .env files"
cp .env.example "$DEST/" 2>/dev/null
cp .env.local "$DEST/" 2>/dev/null

# Copy gitignore
echo "✅ Copying .gitignore"
cp .gitignore "$DEST/"

# Copy Makefile
echo "✅ Copying Makefile"
cp Makefile "$DEST/" 2>/dev/null

echo ""
echo "============================================"
echo "✅ BACKEND COPY COMPLETE!"
echo "============================================"
echo ""
echo "📁 Location: $DEST"
echo ""
echo "📊 What was copied:"
echo "   ✅ All backend services (Go, Python, Node.js)"
echo "   ✅ Database migrations and schemas"
echo "   ✅ Docker configuration"
echo "   ✅ Scripts (start/stop)"
echo "   ✅ Configuration files"
echo "   ✅ Documentation"
echo ""
echo "❌ What was excluded:"
echo "   ❌ Next.js frontend (app/, components/, pages/)"
echo "   ❌ node_modules"
echo "   ❌ Python venv"
echo "   ❌ Build artifacts"
echo ""
echo "🚀 Next steps:"
echo "   1. cd $DEST"
echo "   2. Review the files"
echo "   3. Copy to your target location"
echo ""
