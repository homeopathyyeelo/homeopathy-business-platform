# 🏥 Homeopathy Business Platform

> Complete ERP system for homeopathy businesses with AI-powered features, multi-channel marketing, and comprehensive business management.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.10-blue.svg)](https://docker.com)

---

## 🚀 Quick Start

### One Command to Start Everything

```bash
make start-all
```

That's it! This will:
- ✅ Check prerequisites
- ✅ Start all infrastructure (Kafka, PostgreSQL, Redis, MinIO)
- ✅ Setup database (migrations, seeding)
- ✅ Launch all services (Next.js, APIs, AI service)
- ✅ Display service URLs

**Then open**: http://localhost:3000

### Stop Everything

```bash
make stop-all
```

---

## 📋 What's Included

### Frontend
- **Next.js 15** with React 19
- **TailwindCSS** for styling
- **shadcn/ui** components
- **Responsive** design

### Backend Services
- **API Gateway** (Express) - REST API aggregation
- **GraphQL Gateway** - Unified GraphQL API
- **Fastify API** - High-performance endpoints
- **AI Service** (Python/FastAPI) - ML & AI operations

### Infrastructure
- **Kafka** - Event streaming
- **PostgreSQL** - Primary database with pgvector
- **Redis** - Caching & sessions
- **MinIO** - S3-compatible object storage
- **Zookeeper** - Kafka coordination

### Features
- 📊 **Billing & Invoicing** - GST-compliant billing system
- 📦 **Inventory Management** - Stock tracking, batch management
- 👥 **Customer Management** - Patient records, prescriptions
- 🤖 **AI-Powered** - Content generation, forecasting
- 📱 **Multi-Channel Marketing** - WhatsApp, Email, SMS campaigns
- 📈 **Analytics & Reports** - Business insights, dashboards
- 🔐 **Authentication** - JWT-based auth system

---

## 🌐 Service URLs

Once running, access:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **API Gateway** | http://localhost:5000 | - |
| **GraphQL Playground** | http://localhost:4000/graphql | - |
| **Kafka UI** | http://localhost:8080 | - |
| **MinIO Console** | http://localhost:9001 | minio/minio123 |

---

## 📚 Documentation

- **[▶️ START HERE](./▶️-START-HERE-NEW.md)** - Quick start guide
- **[Development Guide](./DEVELOPMENT-GUIDE.md)** - Comprehensive development docs
- **[Scripts Guide](./SCRIPTS-README.md)** - All scripts explained
- **[Quick Reference](./QUICK-REFERENCE.md)** - Command cheat sheet
- **[Improvements Summary](./STARTUP-IMPROVEMENTS-SUMMARY.md)** - What's new

---

## 🛠️ Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- Lucide Icons

### Backend
- Node.js / TypeScript
- Fastify
- Express
- GraphQL
- Python / FastAPI
- Prisma ORM

### Infrastructure
- Docker & Docker Compose
- Kafka (Confluent)
- PostgreSQL 15 + pgvector
- Redis 7
- MinIO
- Turbo (monorepo)

### DevOps
- Kubernetes (K8s manifests)
- Helm charts
- Terraform (IaC)
- GitHub Actions (CI/CD)
- Grafana & Prometheus (monitoring)

---

## 📦 Project Structure

```
homeopathy-business-platform/
├── app/                        # Next.js application
│   ├── (routes)/              # App routes
│   ├── ai/                    # AI features
│   ├── billing/               # Billing module
│   ├── inventory/             # Inventory module
│   └── ...
├── components/                # React components
├── services/                  # Backend microservices
│   ├── api-fastify/          # Fastify API
│   ├── api-gateway/          # API Gateway
│   ├── graphql-gateway/      # GraphQL Gateway
│   ├── ai-service/           # AI/ML service
│   └── ...
├── packages/                  # Shared packages
│   ├── shared-db/            # Prisma schema
│   └── shared-kafka/         # Kafka utilities
├── infra/                     # Infrastructure as Code
│   ├── k8s/                  # Kubernetes manifests
│   ├── helm/                 # Helm charts
│   └── terraform/            # Terraform configs
├── dev-start.sh              # Development startup script
├── stop-dev.sh               # Stop script
├── Makefile                  # Command shortcuts
└── docker-compose.*.yml      # Docker configurations
```

---

## 🎯 Common Commands

```bash
# Development
make start-all      # Start everything
make stop-all       # Stop everything
make restart-all    # Restart everything

# Infrastructure
make up             # Start infrastructure only
make down           # Stop infrastructure
make status         # Show status

# Database
make db-migrate     # Run migrations
make db-seed        # Seed database
make db-reset       # Reset database

# Testing
make test           # Run tests
make smoke          # Health checks

# Maintenance
make logs           # View logs
make check-ports    # Check port usage
make clean          # Clean artifacts
```

**See all commands**: `make help`

---

## 🔧 Development Workflows

### Option 1: All-in-One (Recommended)
```bash
make start-all
# Everything starts automatically
```

### Option 2: Infrastructure + Local Apps
```bash
# Terminal 1: Infrastructure
make up

# Terminal 2: Database
make db-migrate

# Terminal 3: Apps
npm run dev
```

### Option 3: Selective Services
```bash
make up                    # Infrastructure
npm run dev:app            # Just frontend
# Or run individual services
```

---

## 🧪 Testing

```bash
# Health check all services
make smoke

# Run all tests
make test

# E2E tests
npm run test:e2e

# Load testing
make k6-campaign
```

---

## 🐳 Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.infra.yml` | Infrastructure only (recommended for dev) |
| `docker-compose.master.yml` | Complete stack with all services |
| `docker-compose.production.yml` | Production configuration |

---

## 🔍 Troubleshooting

### Port Already in Use
```bash
make check-ports
make stop-all
```

### Database Issues
```bash
make db-reset
docker logs yeelo-postgres
```

### Services Not Starting
```bash
make smoke
tail -f logs/turbo-dev.log
```

### Clean Restart
```bash
make stop-all
make clean
make start-all
```

**Full troubleshooting guide**: [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md#troubleshooting)

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│                    http://localhost:3000                    │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│  API Gateway    │    │ GraphQL Gateway │
│  Port: 5000     │    │  Port: 4000     │
└────────┬────────┘    └────────┬────────┘
         │                      │
    ┌────┴──────────────────────┴─────┐
    │                                  │
┌───▼────────┐  ┌──────────┐  ┌──────▼──────┐
│ Fastify API│  │ Express  │  │ AI Service  │
│ Port: 3002 │  │ API      │  │ Port: 8001  │
└─────┬──────┘  └────┬─────┘  └──────┬──────┘
      │              │                │
      └──────────────┴────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│   PostgreSQL    │    │     Kafka       │
│   Port: 5433    │    │   Port: 9092    │
└─────────────────┘    └─────────────────┘
```

---

## 🔐 Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"

# Redis
REDIS_URL="redis://localhost:6380"

# Kafka
KAFKA_BROKERS="localhost:9092"

# JWT
JWT_SECRET="your-secret-key"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minio"
MINIO_SECRET_KEY="minio123"

# AI Service (optional)
OPENAI_API_KEY="your-openai-api-key"
```

See `env.example` for full configuration.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**Code Style**:
- TypeScript with strict mode
- Prettier for formatting
- ESLint for linting
- Conventional commits

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Database ORM by [Prisma](https://www.prisma.io/)

---

## 📞 Support

- **Documentation**: Check the [docs](./DEVELOPMENT-GUIDE.md)
- **Issues**: Open an issue on GitHub
- **Quick Help**: Run `make help`

---

## 🎉 Getting Started

Ready to develop? Just run:

```bash
make start-all
```

Then open http://localhost:3000 and start building! 🚀

---

**Made with ❤️ for the Homeopathy Community**
