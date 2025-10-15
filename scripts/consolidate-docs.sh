#!/usr/bin/env bash
# Consolidate Documentation Script
# Archives old .md files and keeps only MASTER-ARCHITECTURE.md

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  📚 Documentation Consolidation Script                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create archive directory
ARCHIVE_DIR="docs/archive/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ARCHIVE_DIR"

echo -e "${YELLOW}Creating archive directory: $ARCHIVE_DIR${NC}"
echo ""

# List of files to archive (excluding MASTER-ARCHITECTURE.md and service-specific READMEs)
FILES_TO_ARCHIVE=(
    "ALL-SERVICES-IMPROVEMENT-PLAN.md"
    "README-AI-SYSTEM.md"
    "DEPLOYMENT-READY.md"
    "START-HERE.md"
    "README-IMPLEMENTATION.md"
    "GOLANG-API-COMPLETE.md"
    "API-REFERENCE.md"
    "README-COMPLETE-SETUP.md"
    "MASTER-SUMMARY.md"
    "AGENT-EXECUTION-READY.md"
    "TEST-RESULTS-COMPLETE.md"
    "COMPLETE-SETUP-GUIDE.md"
    "FINAL-SUMMARY.md"
    "QUICK-START.md"
    "CURRENT-STATUS.md"
    "README-AGENT-READY.md"
    "QUICK-START-GUIDE.md"
    "TEST-RESULTS.md"
    "FINAL-AGENT-SUMMARY.txt"
)

# Archive files
echo -e "${YELLOW}Archiving old documentation files...${NC}"
ARCHIVED_COUNT=0

for file in "${FILES_TO_ARCHIVE[@]}"; do
    if [ -f "$file" ]; then
        echo "  Archiving: $file"
        mv "$file" "$ARCHIVE_DIR/"
        ((ARCHIVED_COUNT++))
    fi
done

# Archive docs folder content (except DEV-CHECKLIST.md)
if [ -d "docs" ]; then
    echo ""
    echo -e "${YELLOW}Archiving docs folder content...${NC}"
    for file in docs/*.md; do
        if [ -f "$file" ] && [ "$(basename $file)" != "DEV-CHECKLIST.md" ]; then
            echo "  Archiving: $file"
            mv "$file" "$ARCHIVE_DIR/"
            ((ARCHIVED_COUNT++))
        fi
    done
fi

echo ""
echo -e "${GREEN}✓ Archived $ARCHIVED_COUNT files${NC}"
echo ""

# Create index of archived files
echo -e "${YELLOW}Creating archive index...${NC}"
cat > "$ARCHIVE_DIR/INDEX.md" << EOF
# Archived Documentation

**Archive Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Reason:** Consolidated into MASTER-ARCHITECTURE.md

## Archived Files

This directory contains documentation files that have been consolidated into the master architecture document.

**New Single Source of Truth:** \`MASTER-ARCHITECTURE.md\`

## Files in this Archive

EOF

ls -1 "$ARCHIVE_DIR" | grep -v "INDEX.md" >> "$ARCHIVE_DIR/INDEX.md"

echo -e "${GREEN}✓ Archive index created${NC}"
echo ""

# Create README pointing to master doc
echo -e "${YELLOW}Updating main README.md...${NC}"
cat > README.md << 'EOF'
# 🏥 Yeelo Homeopathy Business Platform

**Next-Generation AI-Powered Homeopathy Business Management Platform**

---

## 📖 Documentation

**→ [MASTER-ARCHITECTURE.md](MASTER-ARCHITECTURE.md) - START HERE**

This is the **single source of truth** for all platform documentation, including:

- System Architecture
- Infrastructure Setup
- Service Documentation
- API Reference
- Development Guide
- Testing & Quality
- Deployment Guide
- Roadmap

---

## 🚀 Quick Start

```bash
# 1. Start Infrastructure
./START-INFRA.sh

# 2. Run Smoke Tests
./scripts/smoke-test.sh

# 3. Start Services
cd services/api-golang && ./start.sh
cd services/api-express && node src/index-complete.js
```

---

## 📊 Current Status

- **Infrastructure:** 6/6 services running ✅
- **Completed Services:** 2/11 (Golang API, Express API) ✅
- **In Development:** 9/11 services 🔄

---

## 🔗 Quick Links

- **Master Documentation:** [MASTER-ARCHITECTURE.md](MASTER-ARCHITECTURE.md)
- **Development Checklist:** [docs/DEV-CHECKLIST.md](docs/DEV-CHECKLIST.md)
- **Smoke Tests:** `./scripts/smoke-test.sh`
- **Fix NestJS:** `./scripts/fix-nestjs.sh`

---

## 📞 Access Points

**APIs:**
- Golang API: http://localhost:3004 (✅ Ready)
- Express API: http://localhost:3003 (✅ Ready)
- NestJS API: http://localhost:3001 (🔄 Fixing)
- Fastify API: http://localhost:3002 (🔄 Building)

**Infrastructure:**
- Kafka UI: http://localhost:8080
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5433
- Redis: localhost:6380

---

## 🎯 For Developers

1. Read [MASTER-ARCHITECTURE.md](MASTER-ARCHITECTURE.md)
2. Follow setup instructions
3. Use [docs/DEV-CHECKLIST.md](docs/DEV-CHECKLIST.md) to track progress
4. Run tests with `./scripts/smoke-test.sh`

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-08  
**Status:** Production Infrastructure Ready
EOF

echo -e "${GREEN}✓ README.md updated${NC}"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Summary                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Consolidated documentation into MASTER-ARCHITECTURE.md${NC}"
echo -e "${GREEN}✓ Archived $ARCHIVED_COUNT old documentation files${NC}"
echo -e "${GREEN}✓ Created archive at: $ARCHIVE_DIR${NC}"
echo -e "${GREEN}✓ Updated README.md to point to master document${NC}"
echo ""
echo -e "${BLUE}📖 Single Source of Truth: MASTER-ARCHITECTURE.md${NC}"
echo ""
echo "Next steps:"
echo "1. Review MASTER-ARCHITECTURE.md"
echo "2. Delete archived files if satisfied: rm -rf $ARCHIVE_DIR"
echo "3. Commit changes: git add . && git commit -m 'docs: consolidate into master architecture'"
echo ""
