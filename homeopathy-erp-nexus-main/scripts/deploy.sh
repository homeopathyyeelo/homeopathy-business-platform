
#!/bin/bash

# Production Deployment Script for Homeopathy ERP
# This script sets up the production environment

echo "Starting production deployment..."

# Create necessary directories
mkdir -p logs
mkdir -p uploads
mkdir -p backups

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Build the application
echo "Building application..."
npm run build

# Setup database
echo "Setting up database..."
if [ "$1" = "fresh-install" ]; then
    echo "Running fresh database setup..."
    psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE -f database/backup/schema_backup.sql
    psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE -f database/backup/master_data.sql
else
    echo "Running database migrations..."
    # Add your migration commands here
fi

# Set permissions
chmod +x scripts/*.sh
chmod 755 uploads

# Create systemd service file
sudo tee /etc/systemd/system/homeopathy-erp.service > /dev/null <<EOF
[Unit]
Description=Homeopathy ERP Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/homeopathy-erp
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=development

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable homeopathy-erp
sudo systemctl start homeopathy-erp

echo "Deployment completed successfully!"
echo "Application is running on port $PORT"
