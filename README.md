# 🏥 Yeelo Homeopathy Business Platform

**Next-Generation AI-Powered Homeopathy Business Management Platform**

---

## 📖 Documentation

### **→ [MASTER-ARCHITECTURE.md](MASTER-ARCHITECTURE.md) ← START HERE**

This is the **single source of truth** for all platform documentation.

**What's inside:**
- ✅ Complete System Architecture
- ✅ Infrastructure Setup (6 services)
- ✅ All 11 Services Documented
- ✅ API Reference & Examples
- ✅ Development Guide
- ✅ Testing & Quality
- ✅ Deployment Guide
- ✅ 3-Week Roadmap

---

## 🚀 Quick Start

```bash
# 1. Start Infrastructure
./START-INFRA.sh

# 2. Run Smoke Tests
./scripts/smoke-test.sh

# 3. Start Working Services
cd services/api-golang && ./start.sh
cd services/api-express && node src/index-complete.js
```

---

## 📊 Current Status

**Infrastructure:** 6/6 ✅ (PostgreSQL, Redis, Kafka, Zookeeper, MinIO, Kafka UI)  
**Completed Services:** 2/11 ✅ (Golang API, Express API)  
**In Development:** 9/11 🔄

---

## 🔗 Quick Access

**Documentation:**
- [MASTER-ARCHITECTURE.md](MASTER-ARCHITECTURE.md) - Complete documentation
- [docs/DEV-CHECKLIST.md](docs/DEV-CHECKLIST.md) - Development checklist
- [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) - PR template

**Scripts:**
- `./START-INFRA.sh` - Start infrastructure
- `./scripts/smoke-test.sh` - Run all tests
- `./scripts/fix-nestjs.sh` - Fix NestJS

**APIs (Production Ready):**
- Golang API: http://localhost:3004 ✅
- Express API: http://localhost:3003 ✅

**Infrastructure:**
- Kafka UI: http://localhost:8080
- MinIO Console: http://localhost:9001

---

## 🎯 For Developers

1. Read [MASTER-ARCHITECTURE.md](MASTER-ARCHITECTURE.md)
2. Follow setup instructions (Section 7)
3. Use [docs/DEV-CHECKLIST.md](docs/DEV-CHECKLIST.md) to track progress
4. Run `./scripts/smoke-test.sh` after changes

---

## 🔐 Demo Credentials

```
Email: admin@yeelo.com
Password: admin123
Role: ADMIN
```

---

## 📈 Roadmap

**Week 1:** Fix NestJS, Complete Fastify, Implement Auth Service  
**Week 2:** GraphQL Gateway, Python AI, API Gateway, Workers  
**Week 3:** Frontend, Testing, Documentation, Deployment

**See [MASTER-ARCHITECTURE.md](MASTER-ARCHITECTURE.md) Section 12 for details**

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-08  
**Status:** Production Infrastructure Ready

**🎯 START HERE:** [MASTER-ARCHITECTURE.md](MASTER-ARCHITECTURE.md)
