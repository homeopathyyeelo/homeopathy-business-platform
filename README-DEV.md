# 🏥 Yeelo Homeopathy ERP Platform - Complete Documentation

## 🚀 **OVERVIEW**

The **Yeelo Homeopathy ERP Platform** is a comprehensive, enterprise-grade business management system specifically designed for homeopathy clinics and stores. Built with modern microservices architecture, it provides complete ERP functionality with AI-powered features, multi-gateway payments, real-time notifications, and seamless Next.js frontend integration.

## 🏗️ **ARCHITECTURE**

### **Microservices Architecture**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Yeelo Homeopathy ERP Platform               │
├─────────────────────────────────────────────────────────────────┤
│  🌐 Frontend (Next.js)  ───┐  🔧 Microservices                  │
│  📱 Mobile Responsive     │  ├─ 🧑 User Service (Auth)           │
│  ⚡ Real-time Updates     │  ├─ 📦 Product Service (Catalog)      │
│  🎨 Modern UI/UX         │  ├─ 🛒 Order Service (E-commerce)     │
│                           │  ├─ 💳 Payment Service (Multi-gateway)│
│  🔌 API Gateway          │  ├─ 📧 Notification Service (Email/SMS)│
│  Load Balancer           │  └─ 🤖 AI Service (ML/Recommendations) │
├─────────────────────────────────────────────────────────────────┤
│  💾 PostgreSQL  │  📦 Redis  │  🚌 RabbitMQ  │  🔍 Elasticsearch  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 **CORE FEATURES**

### **✅ Enterprise ERP Modules**
- **📦 Inventory Management** - Stock tracking, alerts, transfers
- **🛒 Sales & POS** - Orders, invoices, cash register, hold bills
- **💰 Finance** - Ledger, cashbook, expenses, GST compliance
- **👥 HR & Payroll** - Employee management, attendance, salaries
- **📊 Reports & Analytics** - Sales, inventory, financial reports
- **🏢 Multi-Company Support** - Branch management, consolidation

### **✅ Advanced Features**
- **🤖 AI-Powered** - Product recommendations, chatbot, fraud detection
- **💳 Payment Integration** - Stripe, Razorpay, PayPal with webhooks
- **📱 Real-time Sync** - WebSocket, offline mode, multi-device support
- **🔧 Hardware Integration** - Weighing scales, barcode scanners, printers
- **📧 Communication** - Email, SMS, WhatsApp campaigns
- **🔒 Security** - JWT, RBAC, audit trails, fraud monitoring

## 🚀 **QUICK START**

### **Prerequisites**
```bash
# Required
- Docker & Docker Compose
- Git
- curl (for testing)

# Optional (for development)
- Node.js 18+ (for frontend)
- Go 1.20+ (for Go services)
- Python 3.9+ (for AI services)
```

### **One-Command Setup**
```bash
# Clone repository
git clone <repository-url>
cd homeopathy-business-platform

# Start everything
./build-dev.sh

# Access the application
# Frontend: http://localhost:3000
# API Gateway: http://localhost:8000
```

## 🔧 **DETAILED SETUP**

### **1. Environment Configuration**
```bash
# Copy environment template
cp .env .env.local

# Edit configuration (if needed)
nano .env.local
```

### **2. Build & Start Services**
```bash
# Build all services
./build-dev.sh

# Or start individual components
docker-compose -f docker-compose.dev.yml up -d postgres redis rabbitmq
docker-compose -f docker-compose.dev.yml up -d user-service product-service order-service
```

### **3. Frontend Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### **4. Testing**
```bash
# Test all microservices
./test-all-services.sh

# Test frontend
./test-frontend.sh

# Comprehensive health check
./health-check.sh
```

## 🌐 **API DOCUMENTATION**

### **API Gateway Endpoints**
```
GET  /health              - Health check
GET  /api/health          - API health status
```

### **Service-Specific Endpoints**

#### **🧑 User Service (Port 8001)**
```
POST /auth/register       - User registration
POST /auth/login          - User authentication
GET  /users/me           - Current user profile
PUT  /users/me           - Update profile
POST /auth/forgot-password - Password reset
```

#### **📦 Product Service (Port 8002)**
```
GET  /categories         - Product categories
GET  /products           - Product catalog
POST /products           - Create product
GET  /search             - Search products
GET  /analytics/low-stock - Low stock alerts
```

#### **🛒 Order Service (Port 8003)**
```
GET  /orders             - Order list
POST /orders             - Create order
GET  /orders/{id}        - Order details
POST /orders/{id}/cancel - Cancel order
GET  /analytics/orders   - Order analytics
```

#### **💳 Payment Service (Port 8004)**
```
POST /payments           - Process payment
GET  /payments/{id}      - Payment status
POST /refunds            - Process refund
GET  /analytics/payments - Payment analytics
```

#### **📧 Notification Service (Port 8005)**
```
POST /notifications      - Send notification
GET  /templates          - Notification templates
POST /notifications/bulk - Bulk notifications
GET  /analytics/notifications - Notification stats
```

#### **🤖 AI Service (Port 8006)**
```
POST /v1/recommendations - Get recommendations
POST /v1/chatbot         - Chatbot responses
POST /v1/fraud-check     - Fraud detection
GET  /v1/analytics/*     - AI analytics
```

## 🔧 **DEVELOPMENT WORKFLOW**

### **Adding New Features**

#### **1. Backend Changes**
```bash
# Edit service code
nano services/user-service/main.py

# Test changes
./test-all-services.sh

# Restart service
docker-compose -f docker-compose.dev.yml restart user-service
```

#### **2. Frontend Changes**
```bash
# Edit React components
nano pages/dashboard.tsx

# Test frontend
./test-frontend.sh

# Restart frontend
npm run dev
```

#### **3. Database Changes**
```bash
# Create migration
# Add new models to services/*/models.py

# Restart services to apply changes
./build-dev.sh
```

### **Testing Strategy**
```bash
# Unit tests (individual services)
# Run in each service directory

# Integration tests (service communication)
./test-all-services.sh

# End-to-end tests (full workflows)
./health-check.sh

# Frontend tests
./test-frontend.sh
```

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Services Not Starting**
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs [service-name]

# Restart services
./build-dev.sh

# Check ports
netstat -tuln | grep :800
```

#### **2. Database Connection Issues**
```bash
# Check PostgreSQL
pg_isready -h localhost -p 5432

# Check Redis
redis-cli ping

# Reset database
docker-compose -f docker-compose.dev.yml down -v
./build-dev.sh
```

#### **3. Frontend Issues**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Check Node.js version
node --version

# Install dependencies
npm install
```

### **Logs & Monitoring**
```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f user-service

# Check application logs
tail -f logs/*.log
```

## 🚀 **DEPLOYMENT**

### **Production Deployment**
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Or use Kubernetes
kubectl apply -f k8s/
```

### **Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET_KEY=your-secret-key

# Payment Gateways
STRIPE_SECRET_KEY=sk_...
RAZORPAY_KEY_SECRET=...

# Email
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AI
OPENAI_API_KEY=sk-...
```

## 📊 **MONITORING & OBSERVABILITY**

### **Health Checks**
```bash
# Quick health check
curl http://localhost:8000/health

# Detailed health check
./health-check.sh

# Service-specific health
curl http://localhost:8001/health
```

### **Metrics & Analytics**
```bash
# Prometheus metrics
curl http://localhost:9090

# Grafana dashboards
http://localhost:3001 (admin/admin)

# Application analytics
curl http://localhost:8000/api/analytics
```

## 🔒 **SECURITY**

### **Authentication**
- JWT tokens with expiration
- Password hashing (bcrypt)
- Session management
- Rate limiting

### **Authorization**
- Role-based access control (RBAC)
- Permission-based endpoints
- API key authentication

### **Security Features**
- CORS configuration
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

## 📚 **API DOCUMENTATION**

### **Interactive API Docs**
- **User Service**: http://localhost:8001/docs
- **Product Service**: http://localhost:8002/docs
- **Order Service**: http://localhost:8003/docs
- **Payment Service**: http://localhost:8004/docs
- **Notification Service**: http://localhost:8005/docs
- **AI Service**: http://localhost:8006/docs

### **Postman Collection**
```bash
# Import collection for testing
# Available in docs/ directory
```

## 🧪 **TESTING**

### **Automated Tests**
```bash
# Run all tests
./test-all-services.sh && ./test-frontend.sh

# Individual service tests
cd services/user-service && python -m pytest
cd services/product-service && python -m pytest
```

### **Manual Testing**
```bash
# Test API endpoints
curl http://localhost:8001/health
curl http://localhost:8002/products
curl http://localhost:8003/orders

# Test frontend
curl http://localhost:3000/
curl http://localhost:3000/api/orders
```

## 🚨 **SUPPORT & TROUBLESHOOTING**

### **Getting Help**
1. Check logs: `docker-compose logs [service-name]`
2. Run health check: `./health-check.sh`
3. Check documentation: This README
4. Review configuration: `.env.local`

### **Common Commands**
```bash
# Restart all services
./build-dev.sh

# Stop everything
docker-compose -f docker-compose.dev.yml down

# Clean and rebuild
docker-compose -f docker-compose.dev.yml down -v
./build-dev.sh

# View logs
docker-compose -f docker-compose.dev.yml logs -f [service-name]
```

## 📈 **PERFORMANCE OPTIMIZATION**

### **Caching**
- Redis for session storage
- Database query caching
- Static asset caching

### **Database**
- Connection pooling
- Query optimization
- Index management

### **Frontend**
- Code splitting
- Image optimization
- Bundle analysis

## 🔄 **CI/CD PIPELINE**

### **Automated Deployment**
```bash
# Build pipeline
npm run build
docker-compose -f docker-compose.prod.yml build

# Test pipeline
./test-all-services.sh
./test-frontend.sh

# Deploy pipeline
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 **CONTACT & SUPPORT**

For issues, feature requests, or questions:
- **Documentation**: This README file
- **Issues**: GitHub Issues
- **Email**: support@yeelo.com

---

**🎉 Happy Developing with Yeelo Homeopathy ERP Platform!**
