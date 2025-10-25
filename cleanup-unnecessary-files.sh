#!/bin/bash

# Cleanup script to remove unnecessary shell scripts and documentation files
# Keeps only essential scripts and recent documentation

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}✅${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️${NC}  $1"; }
remove() { echo -e "${RED}🗑️${NC}  Removing: $1"; }

echo ""
echo "🧹 Cleaning up unnecessary files..."
echo ""

# ============================================================================
# REMOVE OLD/DUPLICATE SHELL SCRIPTS
# ============================================================================

log "Removing old/duplicate shell scripts..."

# Old start scripts (we have start-complete.sh now)
rm -f check-browser-errors.sh
rm -f check-frontend.sh
rm -f cleanup-git.sh
rm -f compare-main-vs-bug.sh
rm -f copy-backend-only-clean.sh
rm -f COPY-BACKEND-ONLY.sh
rm -f copy-from-main-step-by-step.sh
rm -f COPY-NEXTJS-SELECTIVE.sh
rm -f CREATE-ALL-PAGES.sh
rm -f CREATE-API-PAGES.sh
rm -f FINAL-FIX.sh
rm -f fix-all-database-references.sh
rm -f fix-database-connections.sh
rm -f FIX-ERRORS.sh
rm -f fix-go-services.sh
rm -f master-start.sh
rm -f nuclear-reset.sh
rm -f QUICK-START.sh
rm -f RUN-ALL-SYSTEMS.sh
rm -f setup-auth-system.sh
rm -f smoke-test.sh
rm -f START-ALL-FEATURES.sh
rm -f START-ALL-SERVICES.sh
rm -f START-BACKEND-ONLY.sh
rm -f START-DASHBOARD-APIS.sh
rm -f START-EVERYTHING.sh
rm -f START-INFRA.sh
rm -f START-NOW.sh
rm -f START-PLATFORM.sh
rm -f start_services.sh
rm -f START-SERVICES.sh
rm -f start.sh
rm -f start-simple.sh
rm -f stop.sh
rm -f stop-simple.sh
rm -f test-db-connection.sh
rm -f test-endpoints.sh
rm -f TEST-INVOICE-SYSTEM.sh
rm -f test-services.sh
rm -f test-startup.sh
rm -f VERIFY-COMPLETE-SYSTEM.sh

remove "Old/duplicate shell scripts (35 files)"

# ============================================================================
# REMOVE OLD DOCUMENTATION FILES
# ============================================================================

log "Removing old documentation files..."

# Old status/planning docs
rm -f 4-SIDED-LAYOUT-COMPLETE.md
rm -f ACTION-PLAN-STATUS.md
rm -f ACTUAL-STATUS-REPORT.md
rm -f AI-SELF-HEALING-SYSTEM-COMPLETE.md
rm -f ALL-404-PAGES-FIXED.md
rm -f ALL-APIS-FIXED-FINAL.md
rm -f ✅-ALL-APIS-IMPLEMENTED.md
rm -f ALL-ISSUES-RESOLVED.md
rm -f ALL-PAGES-FIXED-WITH-APIS.md
rm -f API-ENDPOINTS-FIXED.md
rm -f API-HANDLERS-PLAN.md
rm -f API-INTEGRATION-COMPLETE.md
rm -f APIS-NOW-WORKING.md
rm -f API-STRUCTURE-5000.md
rm -f API-URLS-FIXED.md
rm -f ARCHITECTURE-POLYGLOT-SERVICES.md
rm -f AUTHENTICATION-FIX-PLAN.md
rm -f AUTOMATED-BUG-TRACKING-AND-EXPIRY-SYSTEM.md

# Remove more old docs
rm -f BACKEND-APIS-COMPLETE.md 2>/dev/null
rm -f BACKEND-SYNC-COMPLETE.md 2>/dev/null
rm -f BUG-TRACKING-COMPLETE.md 2>/dev/null
rm -f COMPLETE-SYNC-FINAL.md 2>/dev/null
rm -f DATABASE-FIXES-COMPLETE.md 2>/dev/null
rm -f DEPLOYMENT-GUIDE.md 2>/dev/null
rm -f DOCKER-SETUP-COMPLETE.md 2>/dev/null
rm -f EXPIRY-SYSTEM-COMPLETE.md 2>/dev/null
rm -f FINAL-STATUS-REPORT.md 2>/dev/null
rm -f FRONTEND-BACKEND-INTEGRATION.md 2>/dev/null
rm -f FULL-SYSTEM-STATUS.md 2>/dev/null
rm -f GO-SERVICES-FIXED.md 2>/dev/null
rm -f INTEGRATION-COMPLETE.md 2>/dev/null
rm -f MICROSERVICES-COMPLETE.md 2>/dev/null
rm -f MODULES-UPDATED-FROM-MAIN.md 2>/dev/null
rm -f NEXTJS-FILES-COMPARISON.md 2>/dev/null
rm -f PAGES-FIXED-COMPLETE.md 2>/dev/null
rm -f PLATFORM-STATUS.md 2>/dev/null
rm -f PRODUCTION-READY-CHECKLIST.md 2>/dev/null
rm -f PROJECT-STATUS.md 2>/dev/null
rm -f RBAC-IMPLEMENTATION-COMPLETE.md 2>/dev/null
rm -f SERVICES-STATUS.md 2>/dev/null
rm -f STREAMING-IMPORT-COMPLETE-SUMMARY.md 2>/dev/null
rm -f SYNC-COMPLETE-SUMMARY.md 2>/dev/null
rm -f SYSTEM-HEALTH-CHECK.md 2>/dev/null

remove "Old documentation files (40+ files)"

# ============================================================================
# CLEAN UP OLD LOG FILES
# ============================================================================

log "Cleaning up old log files..."

cd logs 2>/dev/null || mkdir -p logs

# Remove old/duplicate logs
rm -f api-golang-v2-test.log
rm -f api-v2.log
rm -f api-v2-minimal.log
rm -f golang-api.log

# Keep only recent logs (last 7 days)
find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null

# Remove PID files (will be recreated on start)
rm -f *.pid 2>/dev/null

cd ..

remove "Old log files"

# ============================================================================
# REMOVE TEST/TEMPORARY FILES
# ============================================================================

log "Removing test/temporary files..."

rm -f test-xls-parse.go 2>/dev/null
rm -f test-*.js 2>/dev/null
rm -f test-*.ts 2>/dev/null
rm -f *.tmp 2>/dev/null
rm -f *.bak 2>/dev/null

remove "Test/temporary files"

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Cleanup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "✅ KEPT (Essential Scripts):"
echo "   • start-complete.sh       - Start all services"
echo "   • stop-complete.sh        - Stop all services"
echo "   • restart-import-api.sh   - Quick restart import API"
echo "   • start-import-test.sh    - Test import feature only"
echo ""

log "✅ KEPT (Recent Documentation):"
echo "   • START-COMPLETE-UPDATED.md"
echo "   • IMPORT-ERROR-FIXES.md"
echo "   • EXCEL-EMPTY-COLUMN-FIX.md"
echo "   • API-ROUTES-FIXED.md"
echo "   • LIVE-PROGRESS-GUIDE.md"
echo "   • DEBUG-XLS-IMPORT.md"
echo "   • TEST-CSV-IMPORT.md"
echo "   • IMPORT-READY-TO-TEST.md"
echo "   • ADVANCED-STREAMING-IMPORT.md"
echo ""

log "🗑️  REMOVED:"
echo "   • 35+ old/duplicate shell scripts"
echo "   • 40+ old documentation files"
echo "   • Old log files (>7 days)"
echo "   • Test/temporary files"
echo ""

warn "Note: Log files in logs/ directory are kept (except old ones)"
warn "Run 'ls -lh *.sh' to see remaining scripts"
warn "Run 'ls -lh *.md' to see remaining documentation"
echo ""
