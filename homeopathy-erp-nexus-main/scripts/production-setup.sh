#!/bin/bash

# YEELO HOMEOPATHY - Production Setup Script
# This script automates the complete production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="yeelo_homeopathy"
APP_NAME="yeelo-homeopathy"
DB_USER="postgres"
DB_PASS="postgres"
BACKUP_DIR="/opt/yeelo-backups"
LOG_FILE="/var/www/log/yeelo/yeelo-setup.log"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  YEELO HOMEOPATHY Production Setup    ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a $LOG_FILE
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists psql; then
        print_error "PostgreSQL client not found. Please install PostgreSQL."
        exit 1
    fi
    
    if ! command_exists node; then
        print_error "Node.js not found. Please install Node.js 16+."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm not found. Please install npm."
        exit 1
    fi
    
    print_status "All prerequisites met."
}

# Setup database
setup_database() {
    print_status "Setting up PostgreSQL database..."
    
    # Check if database exists
    if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        print_warning "Database $DB_NAME already exists."
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Dropping existing database..."
            dropdb -U $DB_USER $DB_NAME
        else
            print_status "Using existing database."
            return
        fi
    fi
    
    # Create database
    print_status "Creating database $DB_NAME..."
    createdb -U $DB_USER $DB_NAME
    
    # Import schema
    print_status "Importing database schema..."
    if [ -f "database/postgresql/schema.sql" ]; then
        psql -U $DB_USER -d $DB_NAME -f database/postgresql/schema.sql >> $LOG_FILE 2>&1
        print_status "Schema imported successfully."
    else
        print_error "Schema file not found: database/postgresql/schema.sql"
        exit 1
    fi
    
    # Import master data
    print_status "Importing master data..."
    if [ -f "database/postgresql/master_data.sql" ]; then
        psql -U $DB_USER -d $DB_NAME -f database/postgresql/master_data.sql >> $LOG_FILE 2>&1
        print_status "Master data imported successfully."
    else
        print_warning "Master data file not found: database/postgresql/master_data.sql"
    fi
    
    # Verify installation
    print_status "Verifying database installation..."
    table_count=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    print_status "Database contains $table_count tables."
    
    if [ $table_count -lt 30 ]; then
        print_warning "Expected at least 30 tables. Please check the installation."
    fi
}

# Setup application
setup_application() {
    print_status "Setting up application..."
    
    # Install dependencies
    print_status "Installing npm dependencies..."
    npm install >> $LOG_FILE 2>&1
    
    # Build application
    print_status "Building application..."
    npm run build >> $LOG_FILE 2>&1
    
    print_status "Application setup completed."
}

# Setup environment
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f "database/production/environment.template.env" ]; then
            cp database/production/environment.template.env .env
            print_status "Environment template copied to .env"
            print_warning "Please edit .env file with your configuration."
        else
            print_error "Environment template not found."
            exit 1
        fi
    else
        print_warning ".env file already exists."
    fi
}

# Setup backup directory
setup_backup() {
    print_status "Setting up backup directory..."
    
    sudo mkdir -p $BACKUP_DIR
    sudo chown $USER:$USER $BACKUP_DIR
    
    # Make backup script executable
    if [ -f "scripts/backup.sh" ]; then
        chmod +x scripts/backup.sh
        print_status "Backup script made executable."
    fi
    
    print_status "Backup directory created: $BACKUP_DIR"
}

# Setup systemd service (optional)
setup_service() {
    print_status "Setting up systemd service..."
    
    cat > /tmp/yeelo-homeopathy.service << EOF
[Unit]
Description=YEELO HOMEOPATHY ERP System
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=development

[Install]
WantedBy=multi-user.target
EOF

    if [ -w "/etc/systemd/system/" ]; then
        sudo mv /tmp/yeelo-homeopathy.service /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable yeelo-homeopathy
        print_status "Systemd service installed."
    else
        print_warning "Cannot install systemd service. Run with sudo for service installation."
    fi
}

# Performance optimization
optimize_database() {
    print_status "Optimizing database performance..."
    
    psql -U $DB_USER -d $DB_NAME << EOF
-- Create performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || full_medicine_name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_expiry ON inventory(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_customer_date ON invoices(customer_id, invoice_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_product_date ON stock_movements(product_id, date);

-- Analyze tables
ANALYZE;

-- Update statistics
SELECT 'Database optimization completed.' as status;
EOF

    print_status "Database optimization completed."
}

# Security setup
setup_security() {
    print_status "Setting up basic security..."
    
    # Set proper file permissions
    chmod 600 .env 2>/dev/null || true
    
    # Create logs directory
    sudo mkdir -p /var/www/log/yeelo
    sudo chown $USER:$USER /var/www/log/yeelo
    
    print_status "Basic security setup completed."
    print_warning "Please review and implement additional security measures:"
    echo "  - Configure firewall rules"
    echo "  - Set up SSL certificates"
    echo "  - Review database security settings"
    echo "  - Secure API keys and passwords"
}

# Main installation function
main() {
    print_status "Starting YEELO HOMEOPATHY production setup..."
    
    # Create log file
    sudo touch $LOG_FILE
    sudo chown $USER:$USER $LOG_FILE
    
    check_prerequisites
    setup_environment
    setup_database
    setup_application
    setup_backup
    optimize_database
    setup_security
    
    # Optional service setup
    read -p "Do you want to install systemd service? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_service
    fi
    
    print_status "Setup completed successfully!"
    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  YEELO HOMEOPATHY Setup Complete!     ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    echo "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Update company details in application settings"
    echo "3. Test the application: npm start"
    echo "4. Access application at: http://localhost:3000"
    echo
    echo "Database: $DB_NAME"
    echo "Backup Directory: $BACKUP_DIR"
    echo "Log File: $LOG_FILE"
    echo
    echo "For support, check: README_PRODUCTION.md"
}

# Handle command line arguments
case "${1:-}" in
    "fresh-install")
        main
        ;;
    "database-only")
        check_prerequisites
        setup_database
        ;;
    "optimize")
        optimize_database
        ;;
    "backup-setup")
        setup_backup
        ;;
    *)
        echo "Usage: $0 [fresh-install|database-only|optimize|backup-setup]"
        echo
        echo "Commands:"
        echo "  fresh-install  - Complete fresh installation"
        echo "  database-only  - Setup database only"
        echo "  optimize      - Optimize database performance"
        echo "  backup-setup  - Setup backup directory and scripts"
        echo
        echo "For fresh installation: $0 fresh-install"
        exit 1
        ;;
esac