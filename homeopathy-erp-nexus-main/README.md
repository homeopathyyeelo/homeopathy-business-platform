
# YEELO HOMEOPATHY - Production Deployment Guide

## 🏥 Complete ERP Management System for Homeopathy Pharmacies

### Overview
This comprehensive ERP system designed specifically for YEELO HOMEOPATHY includes advanced batch-wise inventory management, multi-potency support, POS billing, GST compliance, customer management, marketing automation, loyalty programs, and complete PostgreSQL compatibility.

## Features
- **Master Management**: Products, customers, suppliers, categories, brands, units, taxes
- **Inventory Management**: Stock tracking, batch management, expiry monitoring
- **Sales & Purchase Management**: Invoicing, purchase orders, returns
- **Marketing Automation**: WhatsApp, SMS, Email, Facebook, Instagram campaigns
- **Loyalty Program**: Customer points, tiers, rewards
- **Prescription Management**: Digital prescriptions, refill reminders
- **Reports & Analytics**: Comprehensive business reports
- **Multi-warehouse Support**: Multiple location inventory tracking

## System Requirements

### Production Server
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v13.0 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 50GB SSD
- **Network**: Stable internet connection

### Development Environment
- **Supabase Account**: For development database
- **Node.js**: v18.0.0 or higher
- **Git**: Latest version

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd homeopathy-erp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp database/production/environment.template.env .env

# Edit .env file with your configuration
nano .env
```

### 4. Database Setup

#### For Production (PostgreSQL)
```bash
# Create database
createdb yeelo_homeopathy

# Run schema setup
psql -d yeelo_homeopathy -f database/backup/schema_backup.sql

# Import master data
psql -d yeelo_homeopathy -f database/backup/master_data.sql
```

#### For Development (Supabase)
- Connect to Supabase project
- Run SQL migrations from `database/backup/` folder

### 5. Build and Deploy
```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh fresh-install
```

## Configuration

### API Keys Required
1. **WhatsApp Business API**: Get from Facebook Business
2. **Kaleyra SMS**: Register at kaleyra.com
3. **Email Service**: SendGrid, Mailgun, or similar
4. **Facebook API**: Facebook Developer Console
5. **Instagram API**: Instagram Basic Display API

### Database Configuration
Update the following in your `.env` file:
```
POSTGRES_HOST=your-database-host
POSTGRES_DATABASE=yeelo_homeopathy
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-db-password
```

### Company Setup
Configure your company details in the app_configuration table:
- Company name, address, phone, email
- GST number and tax information
- Logo and branding elements

## Backup & Maintenance

### Daily Backups
```bash
# Run backup script
./scripts/backup.sh
```

### Monitor Logs
```bash
# Application logs
journalctl -u homeopathy-erp -f

# Database logs
tail -f /var/log/postgresql/postgresql-13-main.log
```

### Update System
```bash
# Update application
git pull origin main
npm install
npm run build
sudo systemctl restart homeopathy-erp
```

## Security Checklist

- [ ] Change default passwords
- [ ] Enable SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Enable database encryption
- [ ] Secure API keys in environment variables
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting

## Performance Optimization

### Database Optimization
- Regular VACUUM and ANALYZE operations
- Index optimization for frequently queried tables
- Connection pooling configuration

### Application Optimization
- Enable gzip compression
- Set up CDN for static assets
- Configure caching strategies
- Monitor memory usage

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL service status
   - Verify connection credentials
   - Check network connectivity

2. **API Integration Failures**
   - Verify API keys are correctly configured
   - Check API rate limits
   - Review API documentation for changes

3. **Performance Issues**
   - Monitor database query performance
   - Check server resource usage
   - Review application logs

### Support
For technical support:
- Check application logs: `journalctl -u homeopathy-erp`
- Review database logs for errors
- Contact system administrator

## License
This software is proprietary. All rights reserved.

## Version
Version 1.0.0 - Production Ready
Last Updated: $(date)
```
