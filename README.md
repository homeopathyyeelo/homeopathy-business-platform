# 🏥 Yeelo Homeopathy Business Platform

> **Next-generation, AI-powered, microservices-based ERP platform for comprehensive homeopathy business management**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Go](https://img.shields.io/badge/Go-1.22-00ADD8)](https://golang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB)](https://www.python.org/)

---

## 🚀 Quick Start

```bash
# 1. Start infrastructure
./START-INFRA.sh

# 2. Start all backend services
./START-ALL-APIS.sh

# 3. Start Next.js frontend
npm run dev
```

**Access:** http://localhost:3000

---

## 📋 Overview

A comprehensive ERP platform built with **microservices architecture**, featuring:

- **20 Main Modules** - Complete business management
- **6 Backend Services** - Different tech stacks for optimal performance
- **Event-Driven Architecture** - Kafka for async communication
- **AI-Powered Features** - ML-based insights and automation
- **GraphQL Gateway** - Unified data access
- **Kubernetes-Ready** - Production deployment configs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Port 3000)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬──────────────┐
        │                │                │              │
        ▼                ▼                ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│  Golang v1   │  │  Golang v2   │  │  NestJS  │  │ Fastify  │
│  (Fiber)     │  │   (Gin)      │  │          │  │          │
│  Port 3005   │  │  Port 3004   │  │Port 3001 │  │Port 3002 │
└──────────────┘  └──────────────┘  └──────────┘  └──────────┘
        │                │                │              │
        └────────────────┴────────────────┴──────────────┘
                         │
        ┌────────────────┼────────────────┬──────────────┐
        │                │                │              │
        ▼                ▼                ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│  Python AI   │  │   GraphQL    │  │  Kafka   │  │PostgreSQL│
│  Port 8001   │  │  Port 4000   │  │Port 9092 │  │Port 5433 │
└──────────────┘  └──────────────┘  └──────────┘  └──────────┘
```

---

## 🎯 Service Distribution

### **Golang v1 (Fiber/Echo) - Port 3005**
- Workflow Automation
- Offline Mode & Sync
- Multi-PC Session Sharing
- Hardware Integration
- Payment Gateway

### **Golang v2 (Gin) - Port 3004**
- Products Management
- Sales & POS
- Inventory Tracking
- Customer Management
- Dashboard & Reports

### **NestJS - Port 3001**
- Purchase Orders
- Finance & Accounting
- HR & Payroll
- Vendor Management

### **Fastify - Port 3002**
- Marketing Campaigns
- Social Media Automation
- CRM & Tickets
- Email/SMS/WhatsApp

### **Python AI - Port 8001**
- AI Chatbot
- Demand Forecasting
- Price Optimization
- Analytics & Insights

### **GraphQL Gateway - Port 4000**
- Unified Data Access
- Federated Queries
- Real-time Subscriptions

---

## 📦 Tech Stack

### **Frontend**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Radix UI
- Shadcn/ui

### **Backend Services**
- **Golang** (Gin, Fiber/Echo)
- **Node.js** (NestJS, Fastify, Express)
- **Python** (FastAPI)

### **Databases & Storage**
- PostgreSQL 15 (with pgVector)
- Redis 7
- MinIO (S3-compatible)

### **Message Queue & Events**
- Apache Kafka
- Zookeeper

### **DevOps**
- Docker & Docker Compose
- Kubernetes
- Turborepo

---

## 🚀 Features

### **Core ERP Modules**
- ✅ Dashboard with real-time metrics
- ✅ Products & Inventory Management
- ✅ Sales & POS System
- ✅ Purchase Orders & GRN
- ✅ Customer & Vendor Management
- ✅ Finance & Accounting
- ✅ HR & Payroll
- ✅ Reports & Analytics

### **Marketing & Automation**
- ✅ Multi-channel Campaigns (WhatsApp, SMS, Email)
- ✅ Social Media Scheduling
- ✅ Customer Segmentation
- ✅ Coupon Management
- ✅ AI Content Generation

### **Advanced Features**
- ✅ AI-Powered Insights
- ✅ Demand Forecasting
- ✅ Price Optimization
- ✅ Workflow Automation
- ✅ Offline Mode with Sync
- ✅ Multi-PC Session Sharing
- ✅ Hardware Integration (Printers, Scanners)

---

## 📚 Documentation

- [Quick Start Guide](./QUICK-START-GUIDE.md)
- [Architecture Details](./ARCHITECTURE-IMPLEMENTATION.md)
- [Integration Plan](./COMPLETE-INTEGRATION-PLAN.md)
- [Implementation Summary](./FINAL-INTEGRATION-SUMMARY.md)
- [SRS Document](./SRS.md)
- [Developer Guide](./README-DEV.md)

---

## 🛠️ Installation

### **Prerequisites**
- Node.js 20.x
- Go 1.22+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### **Install Dependencies**

```bash
# Root dependencies
npm install

# Service dependencies
npm run install:all

# Or manually:
cd services/api-nest && npm install
cd services/api-fastify && npm install
cd services/graphql-gateway && npm install
cd services/kafka-events && npm install

# Python
cd services/ai-service && pip install -r requirements.txt

# Golang
cd services/api-golang && go mod download
cd services/api-golang-v2 && go mod download
```

### **Environment Setup**

```bash
# Copy example env
cp .env.example .env

# Edit with your values
nano .env
```

---

## 🔧 Development

### **Start Development Environment**

```bash
# Terminal 1: Infrastructure
./START-INFRA.sh

# Terminal 2: All Backend Services
./START-ALL-APIS.sh

# Terminal 3: Kafka Events
cd services/kafka-events && npm run dev

# Terminal 4: Next.js
npm run dev
```

### **Test All Services**

```bash
./TEST-ALL-APIS.sh
```

---

## 🐳 Docker Deployment

```bash
# Start all services with Docker Compose
docker-compose -f docker-compose.master.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all
docker-compose down
```

---

## ☸️ Kubernetes Deployment

```bash
# Deploy to Kubernetes
./k8s/DEPLOY-K8S.sh

# Check status
kubectl get all

# Scale services
kubectl scale deployment/api-golang-v2 --replicas=10

# View logs
kubectl logs -f deployment/api-golang-v2
```

---

## 📡 API Endpoints

### **Health Checks**
```
GET http://localhost:3004/health  # Golang v2
GET http://localhost:3005/health  # Golang v1
GET http://localhost:3001/health  # NestJS
GET http://localhost:3002/health  # Fastify
GET http://localhost:8001/health  # Python AI
```

### **Core APIs**
```
# Products
GET    /api/erp/products
POST   /api/erp/products
GET    /api/erp/products/:id
PUT    /api/erp/products/:id
DELETE /api/erp/products/:id

# Sales
GET    /api/erp/sales
POST   /api/erp/sales
GET    /api/erp/sales/:id

# Inventory
GET    /api/erp/inventory
POST   /api/erp/inventory/adjust

# Customers
GET    /api/erp/customers
POST   /api/erp/customers
```

### **GraphQL**
```graphql
# Query
query {
  dashboard {
    sales { total today week month }
    inventory { lowStock expiring }
    customers { total new }
  }
}

# Mutation
mutation {
  createProduct(input: {
    name: "Arnica Montana 30C"
    price: 150
    stock: 100
  }) {
    id
    name
  }
}
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test all services
./TEST-ALL-APIS.sh
```

---

## 📊 Monitoring

### **Service Health**
All services expose `/health` endpoints for monitoring.

### **Metrics**
- Prometheus metrics at `/metrics`
- Grafana dashboards (optional)

### **Logging**
- Structured logging with Winston/Zap
- Centralized logging with ELK stack (optional)

---

## 🔒 Security

- JWT-based authentication
- Role-Based Access Control (RBAC)
- API rate limiting
- Input validation & sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Team

- **Development Team** - Yeelo Technologies
- **Project Lead** - [Your Name]
- **Contributors** - See [CONTRIBUTORS.md](./CONTRIBUTORS.md)

---

## 📞 Support

- **Documentation:** [docs.yeelo.com](https://docs.yeelo.com)
- **Email:** support@yeelo.com
- **Issues:** [GitHub Issues](https://github.com/yeelo/homeopathy-erp/issues)

---

## 🎯 Roadmap

- [x] Core ERP modules
- [x] Microservices architecture
- [x] Event-driven system
- [x] AI integration
- [x] Kubernetes deployment
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-tenant support
- [ ] Blockchain integration
- [ ] IoT device integration

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yeelo/homeopathy-erp&type=Date)](https://star-history.com/#yeelo/homeopathy-erp&Date)

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- NestJS community
- Fastify team
- Go community
- Python FastAPI
- All open-source contributors

---

**Built with ❤️ by Yeelo Technologies**

**Status: Production Ready** ✅
