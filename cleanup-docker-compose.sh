#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Docker Compose Cleanup Script
# ═══════════════════════════════════════════════════════════════════════════
# This script helps identify and archive redundant docker-compose files
# ═══════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

print_header() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_header "Docker Compose File Analysis"

echo -e "${BOLD}Current docker-compose files:${NC}\n"

# List all docker-compose files
compose_files=(
    "docker-compose.infra.yml:KEEP - Infrastructure only (recommended for dev)"
    "docker-compose.master.yml:KEEP - Complete setup with all services"
    "docker-compose.production.yml:KEEP - Production configuration"
    "docker-compose.dev.yml:REDUNDANT - Merged into infra.yml"
    "docker-compose.kafka.yml:REDUNDANT - Merged into infra.yml"
    "docker-compose.ai.yml:REDUNDANT - Merged into master.yml"
    "docker-compose.simple.yml:REDUNDANT - Superseded by infra.yml"
    "docker-compose.prod.yml:REDUNDANT - Duplicate of production.yml"
    "docker-compose.microservices.yml:REVIEW - Different architecture (RabbitMQ based)"
)

for item in "${compose_files[@]}"; do
    IFS=':' read -r file status <<< "$item"
    
    if [ -f "$file" ]; then
        if [[ $status == KEEP* ]]; then
            echo -e "  ${GREEN}✓${NC} ${BOLD}$file${NC}"
            echo -e "    ${CYAN}→${NC} $status"
        elif [[ $status == REDUNDANT* ]]; then
            echo -e "  ${YELLOW}⚠${NC} ${BOLD}$file${NC}"
            echo -e "    ${YELLOW}→${NC} $status"
        else
            echo -e "  ${BLUE}ℹ${NC} ${BOLD}$file${NC}"
            echo -e "    ${BLUE}→${NC} $status"
        fi
    fi
    echo ""
done

print_header "Recommended Actions"

echo -e "${BOLD}Files to KEEP:${NC}"
echo -e "  ${GREEN}•${NC} docker-compose.infra.yml     - For local development"
echo -e "  ${GREEN}•${NC} docker-compose.master.yml    - For full stack testing"
echo -e "  ${GREEN}•${NC} docker-compose.production.yml - For production deployment"

echo -e "\n${BOLD}Files to ARCHIVE:${NC}"
echo -e "  ${YELLOW}•${NC} docker-compose.dev.yml"
echo -e "  ${YELLOW}•${NC} docker-compose.kafka.yml"
echo -e "  ${YELLOW}•${NC} docker-compose.ai.yml"
echo -e "  ${YELLOW}•${NC} docker-compose.simple.yml"
echo -e "  ${YELLOW}•${NC} docker-compose.prod.yml"

echo -e "\n${BOLD}Files to REVIEW:${NC}"
echo -e "  ${BLUE}•${NC} docker-compose.microservices.yml - Uses RabbitMQ instead of Kafka"

echo ""
read -p "$(echo -e ${YELLOW}Would you like to archive redundant files? [y/N]:${NC} )" -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create archive directory
    ARCHIVE_DIR="docker-compose-archive-$(date +%Y%m%d)"
    mkdir -p "$ARCHIVE_DIR"
    
    print_info "Creating archive directory: $ARCHIVE_DIR"
    
    # Move redundant files
    redundant_files=(
        "docker-compose.dev.yml"
        "docker-compose.kafka.yml"
        "docker-compose.ai.yml"
        "docker-compose.simple.yml"
        "docker-compose.prod.yml"
    )
    
    for file in "${redundant_files[@]}"; do
        if [ -f "$file" ]; then
            mv "$file" "$ARCHIVE_DIR/"
            print_success "Archived: $file"
        fi
    done
    
    # Create README in archive
    cat > "$ARCHIVE_DIR/README.md" << EOF
# Archived Docker Compose Files

**Archive Date:** $(date +"%Y-%m-%d %H:%M:%S")

## Reason for Archival

These docker-compose files have been consolidated into the main configuration files:

- **docker-compose.infra.yml** - Infrastructure services only (Kafka, PostgreSQL, Redis, MinIO)
- **docker-compose.master.yml** - Complete application stack
- **docker-compose.production.yml** - Production-ready configuration

## Archived Files

- \`docker-compose.dev.yml\` - Merged into infra.yml
- \`docker-compose.kafka.yml\` - Merged into infra.yml
- \`docker-compose.ai.yml\` - Merged into master.yml
- \`docker-compose.simple.yml\` - Superseded by infra.yml
- \`docker-compose.prod.yml\` - Duplicate of production.yml

## Restoration

If you need to restore any of these files, simply copy them back to the project root.

\`\`\`bash
cp $ARCHIVE_DIR/[filename] .
\`\`\`
EOF
    
    echo ""
    print_success "Archive complete! Files moved to: $ARCHIVE_DIR"
    print_info "A README.md has been created in the archive directory"
    
else
    print_info "Archive cancelled. No files were moved."
fi

echo ""
print_header "Summary"

echo -e "${BOLD}Active docker-compose files:${NC}"
for file in docker-compose.*.yml; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo -e "  ${GREEN}•${NC} $file (${size})"
    fi
done

echo ""
