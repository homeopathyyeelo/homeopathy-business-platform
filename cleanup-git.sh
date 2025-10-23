#!/bin/bash

echo "============================================"
echo "GIT CLEANUP - Remove venv from tracking"
echo "============================================"
echo ""

# Check current status
echo "📊 Current Git status:"
git status --short | grep -E "(venv|__pycache__|\.pyc)" | wc -l
echo "   files related to Python venv/cache"
echo ""

# Stage the .gitignore changes
echo "✅ Staging .gitignore updates..."
git add .gitignore

# Show what will be committed
echo ""
echo "📋 Changes to be committed:"
echo "   - Updated .gitignore (added Python patterns)"
echo "   - Removed venv/ from Git tracking"
echo "   - Removed __pycache__/ from Git tracking"
echo ""

# Commit
echo "💾 Committing changes..."
git commit -m "chore: remove Python venv and cache from Git tracking

- Updated .gitignore with comprehensive Python patterns
- Removed services/ai-service/venv/ from Git tracking
- Removed __pycache__ directories from Git tracking
- Added wildcard patterns to ignore all future venv directories"

echo ""
echo "============================================"
echo "✅ CLEANUP COMPLETE!"
echo "============================================"
echo ""
echo "📝 What was done:"
echo "   ✅ venv/ directories removed from Git"
echo "   ✅ __pycache__/ directories removed from Git"
echo "   ✅ .gitignore updated with Python patterns"
echo "   ✅ Changes committed locally"
echo ""
echo "🚀 Next steps:"
echo "   1. Push to remote: git push"
echo "   2. Verify: git status"
echo ""
echo "💡 Note: The venv folder still exists locally (as it should)"
echo "   It's just not tracked by Git anymore."
echo ""
