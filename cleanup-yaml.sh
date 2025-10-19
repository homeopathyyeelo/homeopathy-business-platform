#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Cleanup Unnecessary Docker Compose Files
# ═══════════════════════════════════════════════════════════════
# This script helps identify and optionally remove redundant 
# docker-compose YAML files
# ═══════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
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

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_header "Docker Compose YAML File Analysis"

# Files to keep
KEEP_FILES=(
    "docker-compose.infra.yml"      # Infrastructure only (RECOMMENDED for development)
    "docker-compose.master.yml"     # Complete setup with all services
    "docker-compose.production.yml" # Production configuration
)

# Files that are redundant or deprecated
REDUNDANT_FILES=(
    "docker-compose.dev.yml"         # Redundant - merged into infra
    "docker-compose.kafka.yml"       # Redundant - part of infra
    "docker-compose.ai.yml"          # Redundant - part of master
    "docker-compose.microservices.yml" # Redundant - uses RabbitMQ instead of Kafka
    "docker-compose.simple.yml"      # Redundant - subset of infra
    "docker-compose.prod.yml"        # Duplicate of production.yml
)

echo -e "${BOLD}Files to KEEP (Essential):${NC}\n"
for file in "${KEEP_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file"
        
        # Show purpose
        case "$file" in
            "docker-compose.infra.yml")
                echo -e "   ${CYAN}→ Infrastructure only: Kafka, PostgreSQL, Redis, MinIO${NC}"
                echo -e "   ${CYAN}→ Use for: Development with local app servers${NC}"
                ;;
            "docker-compose.master.yml")
                echo -e "   ${CYAN}→ All services: Infrastructure + All APIs + Frontend${NC}"
                echo -e "   ${CYAN}→ Use for: Testing complete system in Docker${NC}"
                ;;
            "docker-compose.production.yml")
                echo -e "   ${CYAN}→ Production-ready: Health checks, resource limits${NC}"
                echo -e "   ${CYAN}→ Use for: Production deployment${NC}"
                ;;
        esac
        echo ""
    fi
done

echo -e "${BOLD}Files that are REDUNDANT:${NC}\n"
BACKUP_DIR="./docker-compose-archive"
files_to_archive=()

for file in "${REDUNDANT_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_warning "$file"
        files_to_archive+=("$file")
        
        # Show reason
        case "$file" in
            "docker-compose.dev.yml")
                echo -e "   ${CYAN}→ Reason: Functionality merged into docker-compose.infra.yml${NC}"
                ;;
            "docker-compose.kafka.yml")
                echo -e "   ${CYAN}→ Reason: Kafka setup included in docker-compose.infra.yml${NC}"
                ;;
            "docker-compose.ai.yml")
                echo -e "   ${CYAN}→ Reason: AI services included in docker-compose.master.yml${NC}"
                ;;
            "docker-compose.microservices.yml")
                echo -e "   ${CYAN}→ Reason: Uses RabbitMQ; project standardized on Kafka${NC}"
                ;;
            "docker-compose.simple.yml")
                echo -e "   ${CYAN}→ Reason: Subset of docker-compose.infra.yml${NC}"
                ;;
            "docker-compose.prod.yml")
                echo -e "   ${CYAN}→ Reason: Duplicate of docker-compose.production.yml${NC}"
                ;;
        esac
        echo ""
    fi
done

# Summary
echo -e "${BOLD}Summary:${NC}"
print_info "Essential files: ${#KEEP_FILES[@]}"
print_warning "Redundant files: ${#files_to_archive[@]}"

if [ ${#files_to_archive[@]} -eq 0 ]; then
    echo -e "\n${GREEN}No redundant files found. Your setup is clean!${NC}\n"
    exit 0
fi

# Ask user what to do
echo -e "\n${BOLD}What would you like to do?${NC}"
echo -e "  ${CYAN}1${NC} - Archive redundant files to $BACKUP_DIR (recommended)"
echo -e "  ${CYAN}2${NC} - Delete redundant files permanently"
echo -e "  ${CYAN}3${NC} - Keep all files (do nothing)"
echo ""
read -p "Enter your choice [1-3]: " choice

case $choice in
    1)
        # Archive files
        mkdir -p "$BACKUP_DIR"
        print_info "Archiving redundant files to $BACKUP_DIR..."
        
        for file in "${files_to_archive[@]}"; do
            mv "$file" "$BACKUP_DIR/"
            print_success "Archived: $file"
        done
        
        # Create README in archive
        cat > "$BACKUP_DIR/README.md" << EOF
# Archived Docker Compose Files

These files were archived on $(date) as they are redundant.

## Archived Files
$(printf "- %s\n" "${files_to_archive[@]}")

## Current Active Files
- **docker-compose.infra.yml** - Infrastructure only (for development)
- **docker-compose.master.yml** - Complete setup with all services
- **docker-compose.production.yml** - Production configuration

## To Restore
If you need any of these files, simply move them back to the project root.

EOF
        
        print_success "Archive complete! Files moved to $BACKUP_DIR"
        ;;
        
    2)
        # Delete files
        print_warning "This will permanently delete the files!"
        read -p "Are you sure? [y/N]: " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for file in "${files_to_archive[@]}"; do
                rm "$file"
                print_success "Deleted: $file"
            done
            print_success "Deletion complete!"
        else
            print_info "Deletion cancelled"
        fi
        ;;
        
    3)
        print_info "Keeping all files. No changes made."
        ;;
        
    *)
        print_warning "Invalid choice. No changes made."
        ;;
esac

echo -e "\n${BOLD}${GREEN}Cleanup complete!${NC}\n"
