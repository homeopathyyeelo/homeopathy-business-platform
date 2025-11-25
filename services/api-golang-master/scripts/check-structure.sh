#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Industry Standards Compliance Check                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0
SCORE=100

# Function to report error
report_error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
    SCORE=$((SCORE - $2))
}

# Function to report warning
report_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
    SCORE=$((SCORE - $2))
}

# Function to report success
report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo -e "${BLUE}Checking project structure...${NC}\n"

# Check 1: No .go files in root (except _test.go)
echo -e "${BLUE}[1/15]${NC} Checking for .go files in root..."
GO_FILES=$(find . -maxdepth 1 -name "*.go" -not -name "*_test.go" 2>/dev/null)
if [ ! -z "$GO_FILES" ]; then
    report_error "Found .go files in root directory. Move to internal/ or cmd/" 15
    echo "$GO_FILES" | sed 's/^/       /'
else
    report_success "No .go files in root"
fi

# Check 2: cmd/main.go exists
echo -e "\n${BLUE}[2/15]${NC} Checking entry point..."
if [ ! -f "cmd/main.go" ]; then
    report_error "cmd/main.go missing. Entry point should be here" 15
else
    report_success "cmd/main.go exists"
fi

# Check 3: No cmd/main.go (old location)
echo -e "\n${BLUE}[3/15]${NC} Checking for old cmd/main.go..."
if [ -f "cmd/main.go" ]; then
    report_warning "cmd/main.go still exists. Should be cmd/main.go" 5
else
    report_success "No old cmd/main.go"
fi

# Check 4: No duplicate handlers/ folder
echo -e "\n${BLUE}[4/15]${NC} Checking for duplicate handlers/ folder..."
if [ -d "handlers" ]; then
    report_error "handlers/ folder exists. Should only use internal/handlers/" 10
else
    report_success "No duplicate handlers/ folder"
fi

# Check 5: No duplicate middleware/ folder
echo -e "\n${BLUE}[5/15]${NC} Checking for duplicate middleware/ folder..."
if [ -d "middleware" ]; then
    report_error "middleware/ folder exists. Should only use internal/middleware/" 10
else
    report_success "No duplicate middleware/ folder"
fi

# Check 6: .gitignore exists
echo -e "\n${BLUE}[6/15]${NC} Checking .gitignore..."
if [ ! -f ".gitignore" ]; then
    report_error ".gitignore missing" 5
else
    report_success ".gitignore exists"
fi

# Check 7: Makefile exists
echo -e "\n${BLUE}[7/15]${NC} Checking Makefile..."
if [ ! -f "Makefile" ]; then
    report_warning "Makefile missing (recommended for automation)" 5
else
    report_success "Makefile exists"
fi

# Check 8: No binaries in root
echo -e "\n${BLUE}[8/15]${NC} Checking for binaries in root..."
BINARIES=$(find . -maxdepth 1 -type f -executable 2>/dev/null | grep -v ".sh$")
if [ ! -z "$BINARIES" ]; then
    report_warning "Executable binaries found in root. Add to .gitignore" 5
    echo "$BINARIES" | sed 's/^/       /'
else
    report_success "No binaries in root"
fi

# Check 9: internal/ structure
echo -e "\n${BLUE}[9/15]${NC} Checking internal/ structure..."
REQUIRED_DIRS=("internal/handlers" "internal/services" "internal/models" "internal/config" "internal/database")
MISSING_DIRS=()
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        MISSING_DIRS+=("$dir")
    fi
done

if [ ${#MISSING_DIRS[@]} -gt 0 ]; then
    report_warning "Missing directories: ${MISSING_DIRS[*]}" 5
else
    report_success "All required internal/ directories exist"
fi

# Check 10: go.mod exists
echo -e "\n${BLUE}[10/15]${NC} Checking go.mod..."
if [ ! -f "go.mod" ]; then
    report_error "go.mod missing" 10
else
    report_success "go.mod exists"
fi

# Check 11: README exists
echo -e "\n${BLUE}[11/15]${NC} Checking README.md..."
if [ ! -f "README.md" ]; then
    report_warning "README.md missing or empty" 3
else
    report_success "README.md exists"
fi

# Check 12: Dockerfile exists
echo -e "\n${BLUE}[12/15]${NC} Checking Dockerfile..."
if [ ! -f "Dockerfile" ]; then
    report_warning "Dockerfile missing (recommended for containerization)" 3
else
    report_success "Dockerfile exists"
fi

# Check 13: Check for .env in git
echo -e "\n${BLUE}[13/15]${NC} Checking for .env in version control..."
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
    report_error ".env is tracked in git (security risk!)" 10
else
    report_success ".env not tracked in git"
fi

# Check 14: migrations/ folder
echo -e "\n${BLUE}[14/15]${NC} Checking migrations/ folder..."
if [ ! -d "migrations" ]; then
    report_warning "migrations/ folder missing" 3
else
    report_success "migrations/ folder exists"
fi

# Check 15: tests/ folder
echo -e "\n${BLUE}[15/15]${NC} Checking tests/ folder..."
if [ ! -d "tests" ]; then
    report_warning "tests/ folder missing" 2
else
    report_success "tests/ folder exists"
fi

# Final Score
echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Compliance Score                                       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $SCORE -ge 90 ]; then
    echo -e "  ${GREEN}Score: $SCORE/100 ✅ EXCELLENT${NC}"
elif [ $SCORE -ge 70 ]; then
    echo -e "  ${YELLOW}Score: $SCORE/100 ⚠️  GOOD (minor issues)${NC}"
elif [ $SCORE -ge 50 ]; then
    echo -e "  ${YELLOW}Score: $SCORE/100 ⚠️  NEEDS IMPROVEMENT${NC}"
else
    echo -e "  ${RED}Score: $SCORE/100 ❌ CRITICAL ISSUES${NC}"
fi

echo ""
echo -e "  Errors: ${RED}$ERRORS${NC}"
echo -e "  Warnings: ${YELLOW}$WARNINGS${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Perfect! Project structure is compliant with industry standards!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "\n${YELLOW}⚠️  Structure is mostly compliant with $WARNINGS warning(s).${NC}"
    echo -e "See INDUSTRY_STANDARDS_COMPLIANCE.md for recommendations."
    exit 0
else
    echo -e "\n${RED}❌ Found $ERRORS critical issue(s) and $WARNINGS warning(s).${NC}"
    echo -e "Run: ${YELLOW}bash scripts/migrate-structure.sh${NC} to auto-fix"
    echo -e "Or see: ${YELLOW}INDUSTRY_STANDARDS_COMPLIANCE.md${NC} for manual fixes"
    exit 1
fi
