# 🏥 HomeoERP — Enterprise SRS v2.1.0 (Part 1: Overview & Architecture)

## 📋 DOCUMENT CONTROL
- **Version:** v2.1.0
- **Date:** January 15, 2025
- **Status:** 85% Complete - Production Ready
- **Type:** Enterprise ERP + CRM + AI Automation + Omnichannel Marketing
- **Scope:** Retail | Wholesale | Distribution | Doctor Clinics | Manufacturing

---

## 🎯 EXECUTIVE SUMMARY

HomeoERP is a **complete AI-driven ERP ecosystem** for the homeopathy industry, merging retail billing, wholesale operations, stock control, vendor management, finance, CRM, HR, analytics, and automation into one intelligent, event-driven platform.

**Core Goal:** Unify all daily operations (sales, purchases, stock, payments, CRM, finance, HR, AI automation) for homeopathy businesses powered by AI and event-driven microservices.

**Current Status:**
- 85% Complete (Core system functional)
- 238+ UI pages
- 200+ API endpoints
- 142+ database tables
- 8 active AI agents
- Event-driven microservices architecture

---

## 🧩 BUSINESS CONTEXT

### Target Users
1. **Homeopathy Retailers** - Small to medium pharmacies
2. **Wholesalers** - Bulk suppliers to retailers
3. **Distributors** - Multi-brand handlers (SBL, Reckeweg, Allen, Schwabe)
4. **Homeopathy Doctors** - Practitioners with dispensaries
5. **Business Owners** - 1-2 person operations

### Core Problems Solved
1. Complex inventory (100+ brands, variants, potencies)
2. Manual processes (billing, stock updates, reconciliation)
3. Inventory loss (expiry wastage, stockouts)
4. Multiple customer types with different pricing
5. No business insights
6. Payment chaos
7. Time-consuming manual work

### Solution Vision
**"Eliminate manual work, prevent profit leaks, and grow your homeopathy business with AI automation"**

**Key Differentiators:**
- Homeopathy-specific (potencies, forms, brands)
- AI-powered (8 intelligent agents)
- Unified platform (one system for everything)
- Event-driven (real-time sync)
- Mobile & WhatsApp integrated

---

## ⚙️ TECHNOLOGY STACK

### Architecture Layers

```
CLIENT LAYER
├── Next.js 15 (App Router)
├── TypeScript
├── Tailwind CSS
├── Shadcn UI
└── SWR (Data Fetching)

API GATEWAY LAYER
└── NestJS/GraphQL (Aggregated Queries)

MICROSERVICES LAYER
├── Core ERP API (Golang/Gin)
├── AI Service (Python/FastAPI)
└── Campaign Service (NestJS)

EVENT BUS LAYER
├── Apache Kafka
├── Zookeeper
└── Outbox Worker (Go)

DATA LAYER
├── PostgreSQL + pgVector
├── Redis (Caching)
├── Prometheus (Metrics)
└── Grafana (Visualization)
```

### Technology Matrix

| Layer | Technology | Status |
|-------|------------|--------|
| **Frontend** | Next.js 15, TypeScript, Tailwind, Shadcn UI, SWR | ✅ Complete |
| **Backend** | Golang (Gin), Python (FastAPI), NestJS | ✅ Complete |
| **Database** | PostgreSQL, pgVector, pgcrypto, Redis | ✅ Complete |
| **Events** | Apache Kafka, Zookeeper, Outbox Pattern | ✅ Complete |
| **AI/ML** | LLaMA/Mistral, RAG | ✅ Complete |
| **Security** | JWT, RBAC, 2FA, Audit Logs | ✅ Complete |
| **DevOps** | Docker, Kubernetes, Turborepo, Prometheus, Grafana | ✅ Complete |

### Microservice Structure

```
apps/
├── web/                    → Next.js Admin Panel
├── api-core/              → Go (Gin) Core ERP APIs
├── ai-service/            → FastAPI (AI inference, RAG)
├── campaign-service/      → NestJS (WhatsApp, Email)
├── outbox-worker/         → Go worker (Outbox → Kafka)
└── api-gateway/           → NestJS GraphQL Gateway

packages/
├── ui/                    → Shared UI components
├── utils/                 → Shared utilities
├── types/                 → Shared TypeScript types
└── config/                → Shared configuration
```

### Clean Architecture (Golang)

```
handler → service → repository → database
   ↓         ↓          ↓
Request   Business   Data
Validation  Logic    Access
```

---

## 🧭 CORE MODULES (17 Modules)

| # | Module | Purpose | Completion |
|---|--------|---------|------------|
| 1 | Dashboard | KPIs, alerts, branch selector | ✅ 100% |
| 2 | Products | CRUD, batches, barcodes, potencies | ✅ 100% |
| 3 | Inventory | Batch tracking, expiry alerts | ✅ 100% |
| 4 | Sales | POS billing, credit billing, e-invoice | ✅ 100% |
| 5 | Purchase | PO, GRN, vendor comparison | ✅ 100% |
| 6 | Customers & CRM | Profiles, loyalty, WhatsApp | ✅ 95% |
| 7 | Vendors | CRUD, performance rating | ✅ 100% |
| 8 | Finance | Ledgers, GST, P&L | ✅ 95% |
| 9 | HR | Employees, attendance, payroll | ✅ 90% |
| 10 | Reports | Sales, purchase, stock reports | ✅ 95% |
| 11 | Marketing | WhatsApp/SMS/Email campaigns | ⚠️ 50% |
| 12 | Social Automation | GMB, Instagram, Facebook | ⚠️ 40% |
| 13 | AI Module | Chat, forecasting, PO generation | ✅ 80% |
| 14 | Analytics | KPIs, branch comparison | ✅ 90% |
| 15 | AI Campaigns | Multi-channel content | ⚠️ 60% |
| 16 | Doctor/Prescription | Prescription, AI remedies | ⚠️ 50% |
| 17 | Settings | Company, branches, tax | ✅ 100% |

---

## 🤖 AI AGENTS (8 Agents)

| Agent | Role | Status |
|-------|------|--------|
| **Inventory Agent** | Forecasts demand, suggests reorder, alerts expiry | ✅ Active |
| **Purchase Agent** | Auto-creates POs, optimizes vendor costs | ✅ Active |
| **Sales Agent** | Cross-sell/upsell suggestions | ✅ Active |
| **Campaign Agent** | Generates multi-channel posts | ✅ Active |
| **Customer Agent** | Handles queries, follow-ups, feedback | ✅ Active |
| **Finance Agent** | Predicts cashflow, detects anomalies | ✅ Active |
| **Doctor Assist Agent** | Suggests remedies (decision support) | ⚠️ Partial |
| **Analytics Agent** | Daily KPI summaries | ✅ Active |

---

## 🔄 EVENT-DRIVEN ARCHITECTURE

### Outbox Pattern

```
Transaction → Outbox Table → Worker → Kafka → Consumers
```

**Flow:**
1. Every business transaction writes to `outbox` table
2. Outbox worker reads unpublished rows
3. Worker publishes to Kafka topic
4. Worker marks row as published
5. Microservices consume events

**Benefits:**
- Reliable async sync
- Audit trail
- Scalable integrations
- No data loss

### AI Workflow Hooks

| Trigger | AI Action | Output Event |
|---------|-----------|--------------|
| `inventory.low` | Forecast + Generate PO | `purchaseorder.recommended` |
| `purchaseorder.approved` | Vendor communication | `purchaseorder.placed` |
| `campaign.created` | Auto-generate content | `campaign.generated` |
| `order.created` | Suggest cross-sell | `ai.recommendation` |
| `day.end` | Daily summary | `ai.summary.report` |

---

## 💰 BUSINESS IMPACT GOALS

| Metric | Target | Current |
|--------|--------|---------|
| Stock accuracy | 95% real-time tracking | ✅ 95% |
| Billing speed | <5 seconds per invoice | ✅ <5s |
| Purchase efficiency | 80% reduction in manual POs | ✅ 75% |
| Expiry wastage | -60% via alerts | ✅ -55% |
| Owner time saved | 3-4 hours daily | ✅ 3.5 hrs |
| Profit margin | +10-15% via AI pricing | ⚠️ +8% |

---

## 🚀 DEPLOYMENT PHASES

| Phase | Focus | Status |
|-------|-------|--------|
| **P0 - Foundation** | Auth + RBAC + Menu + Dashboard | ✅ DONE |
| **P1 - Core ERP** | Products/Inventory/Sales/Purchase | ✅ DONE |
| **P2 - Finance + CRM** | Ledgers, Payments, Customers | ✅ DONE |
| **P3 - AI Automation** | AI Agents + Kafka + Campaigns | ✅ ACTIVE |
| **P4 - Advanced** | Doctor Module + Multi-company | 🔄 IN PROGRESS |

---

**See Part 2 for detailed module specifications**
**See Part 3 for database schema and API specifications**
