# 🏥 Yeelo Homeopathy Business Platform - Quick Start Guide

## 🎯 What is This Platform?

This is a **complete AI-powered business management system** for your homeopathy medicine business in India. It includes:

### ✅ What's Included

1. **ERP System** - Inventory, Purchase, Sales, Finance, HR management
2. **E-commerce** - Online store for customers (B2C)
3. **B2B Portal** - Dealer/distributor ordering system
4. **POS System** - Shop counter sales
5. **Marketing Automation** - WhatsApp, SMS, Email campaigns
6. **AI Features** - Content generation, demand forecasting, customer insights
7. **Business Intelligence** - Reports, analytics, profit analysis

---

## 🚀 How to Start the Platform (3 Simple Steps)

### Step 1: Make Sure You Have These Installed

```bash
# Check if you have these:
docker --version          # Should show Docker version
docker compose version    # Should show Docker Compose version
node --version           # Should show Node.js v18 or higher
npm --version            # Should show npm version
```

If any are missing, install them first.

### Step 2: Run the Startup Script

```bash
./START-PLATFORM.sh
```

That's it! The script will:
- Install all dependencies
- Start database, Redis, Kafka
- Setup and seed the database
- Start all backend services
- Start the frontend

### Step 3: Open Your Browser

Go to: **http://localhost:4000**

---

## 📊 What Services Are Running?

After startup, you'll have these services:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:4000 | Main web application |
| **API Gateway** | http://localhost:3000 | Central API entry point |
| **Main API** | http://localhost:3002 | Business logic (NestJS) |
| **Campaigns API** | http://localhost:3001 | Marketing campaigns (Fastify) |
| **AI Service** | http://localhost:8001 | AI/ML features (Python) |
| **Kafka UI** | http://localhost:8080 | Event monitoring |
| **MinIO Console** | http://localhost:9001 | File storage (user: minio, pass: minio123) |

### Database Connection

- **Host:** localhost:5433
- **Database:** yeelo_homeopathy
- **User:** postgres
- **Password:** postgres

---

## 🛠️ Common Tasks

### View Logs

```bash
# Frontend logs
tail -f /tmp/nextjs.log

# API Gateway logs
tail -f /tmp/api-gateway.log

# Main API logs
tail -f /tmp/api-nest.log

# Campaigns API logs
tail -f /tmp/api-fastify.log

# Docker services logs
docker compose -f docker-compose.dev.yml logs -f
```

### Stop All Services

```bash
# Stop Docker services
docker compose -f docker-compose.dev.yml down

# Stop Node.js services
pkill -f 'node.*next'
pkill -f 'node.*nest'
pkill -f 'ts-node-dev'
```

### Restart a Single Service

```bash
# Restart frontend
pkill -f 'node.*next'
PORT=4000 npm run dev:app

# Restart API Gateway
cd services/api-gateway && npm run dev

# Restart Main API
cd services/api-nest && npm run dev

# Restart Campaigns API
cd services/api-fastify && npm run dev
```

### Reset Database

```bash
cd packages/shared-db
npx prisma migrate reset
npm run seed
cd ../..
```

---

## 📁 Project Structure

```
homeopathy-business-platform/
├── app/                    # Next.js frontend pages
│   ├── dashboard/         # Main dashboard
│   ├── inventory/         # Inventory management
│   ├── sales/            # Sales management
│   ├── purchases/        # Purchase management
│   ├── marketing/        # Marketing campaigns
│   ├── b2b/              # B2B dealer portal
│   ├── pos/              # POS system
│   └── store/            # E-commerce store
│
├── services/              # Backend microservices
│   ├── api-gateway/      # API Gateway (Express)
│   ├── api-nest/         # Main API (NestJS)
│   ├── api-fastify/      # Campaigns API (Fastify)
│   ├── ai-service/       # AI/ML Service (Python)
│   └── outbox-worker/    # Event processing
│
├── packages/
│   └── shared-db/        # Database schema (Prisma)
│
└── docker-compose.dev.yml # Infrastructure setup
```

---

## 🔧 Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

```bash
# Check what's using the port
lsof -i :4000  # or :3000, :3001, :3002, :8001

# Kill the process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.dev.yml ps

# Restart PostgreSQL
docker compose -f docker-compose.dev.yml restart postgres

# Check logs
docker compose -f docker-compose.dev.yml logs postgres
```

### AI Service Not Starting

```bash
# Check AI service logs
docker compose -f docker-compose.dev.yml logs ai-service

# Rebuild AI service
docker compose -f docker-compose.dev.yml up -d --build ai-service
```

### Frontend Not Loading

```bash
# Check if Next.js is running
curl http://localhost:4000

# Check logs
tail -f /tmp/nextjs.log

# Restart frontend
pkill -f 'node.*next'
PORT=4000 npm run dev:app
```

---

## 🎓 Next Steps

### 1. Explore the Platform

- **Dashboard:** http://localhost:4000/dashboard
- **Inventory:** http://localhost:4000/inventory
- **Sales:** http://localhost:4000/sales
- **Marketing:** http://localhost:4000/marketing
- **B2B Portal:** http://localhost:4000/b2b
- **POS System:** http://localhost:4000/pos

### 2. Add Your Products

1. Go to Products section
2. Add your homeopathy medicines
3. Set prices for different customer types (retail, dealer, distributor)

### 3. Configure Marketing

1. Go to Marketing section
2. Set up WhatsApp/SMS templates
3. Create customer segments
4. Launch campaigns

### 4. Try AI Features

1. Go to AI section
2. Generate product descriptions
3. Get demand forecasts
4. Analyze customer insights

---

## 📚 Additional Documentation

- **Complete Architecture:** See `MASTER-SUMMARY.md`
- **Implementation Details:** See `README-IMPLEMENTATION.md`
- **AI System Guide:** See `docs/ai-system-guide.md`
- **API Documentation:** 
  - Main API: http://localhost:3002/docs
  - Campaigns API: http://localhost:3001/documentation

---

## 🆘 Need Help?

### Check Logs First

Most issues can be diagnosed from logs:

```bash
# All Docker services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f ai-service

# Node.js services
tail -f /tmp/*.log
```

### Common Issues

1. **"Cannot connect to database"**
   - Wait 10 seconds after starting Docker services
   - Check: `docker compose -f docker-compose.dev.yml ps`

2. **"Port 4000 already in use"**
   - Another Next.js instance is running
   - Kill it: `pkill -f 'node.*next'`

3. **"Module not found"**
   - Dependencies not installed
   - Run: `npm install` in the root directory

4. **"Prisma Client not generated"**
   - Run: `cd packages/shared-db && npx prisma generate`

---

## 🎉 Success!

Your Yeelo Homeopathy Business Platform is now running!

**Main URL:** http://localhost:4000

Start managing your homeopathy business with AI-powered automation! 🚀
