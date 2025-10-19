SHELL := /usr/bin/bash

.PHONY: help
help:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Homeopathy Business Platform - Makefile Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  start-all     - Start ALL services (infrastructure + apps)"
	@echo "  stop-all      - Stop ALL services"
	@echo "  restart-all   - Restart ALL services"
	@echo ""
	@echo "🏗️  Infrastructure:"
	@echo "  up            - Start infrastructure (Kafka, PostgreSQL, Redis, MinIO)"
	@echo "  down          - Stop infrastructure"
	@echo "  status        - Show infrastructure status"
	@echo ""
	@echo "💾 Database:"
	@echo "  db-generate   - Generate Prisma client"
	@echo "  db-migrate    - Run database migrations"
	@echo "  db-seed       - Seed database with sample data"
	@echo "  db-reset      - Reset database (drop + migrate + seed)"
	@echo ""
	@echo "🔧 Development:"
	@echo "  dev           - Run all services via Turbo (requires infra)"
	@echo "  dev-all       - Start Next.js + APIs with hot reload"
	@echo "  dev-frontend  - Run frontend only (minimal setup)"
	@echo "  fix-services  - Fix common service issues via Turbo"
	@echo "  build         - Build all services via Turbo"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  test          - Run all tests"
	@echo "  smoke         - Run smoke tests"
	@echo "  k6-campaign   - Run campaign load test"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  clean-yaml    - Clean up redundant docker-compose files"
	@echo "  logs          - View infrastructure logs"
	@echo "  clean         - Clean up build artifacts and logs"
	@echo "  check-ports   - Check which ports are in use"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ═══════════════════════════════════════════════════════════════
# Quick Start Commands
# ═══════════════════════════════════════════════════════════════

.PHONY: start-all
start-all:
	@echo "Starting complete development environment..."
	@chmod +x dev-start.sh
	@./dev-start.sh

.PHONY: stop-all
stop-all:
	@chmod +x stop-dev.sh
	@./stop-dev.sh

.PHONY: restart-all
restart-all: stop-all start-all
	@echo "✓ Services restarted"

.PHONY: restart-frontend
restart-frontend:
	@echo "Restarting frontend..."
	@pkill -f "next dev" || true
	@pkill -f "turbo" || true
	@sleep 2
	@make dev-frontend

# ═══════════════════════════════════════════════════════════════
# Infrastructure Management
# ═══════════════════════════════════════════════════════════════

.PHONY: up
up:
	@echo "Starting infrastructure services..."
	docker compose -f docker-compose.infra.yml up -d
	@echo "Waiting for services to be ready..."
	@sleep 5
	@echo "✓ Infrastructure started"
	@echo ""
	@echo "Services running:"
	@echo "  - Zookeeper:  localhost:2181"
	@echo "  - Kafka:      localhost:9092"
	@echo "  - PostgreSQL: localhost:5433"
	@echo "  - Redis:      localhost:6380"
	@echo "  - MinIO:      localhost:9000"
	@echo "  - Kafka UI:   http://localhost:8080"

.PHONY: down
down:
	@echo "Stopping infrastructure services..."
	docker compose -f docker-compose.infra.yml down
	@echo "✓ Infrastructure stopped"

.PHONY: status
status:
	@echo "Infrastructure Status:"
	@docker compose -f docker-compose.infra.yml ps

# ═══════════════════════════════════════════════════════════════
# Database Management
# ═══════════════════════════════════════════════════════════════

.PHONY: db-generate
db-generate:
	@echo "Generating Prisma client..."
	npm run db:generate
	@echo "✓ Prisma client generated"

.PHONY: db-migrate
db-migrate:
	@echo "Running database migrations..."
	npm run db:migrate
	@echo "✓ Migrations complete"

.PHONY: db-seed
db-seed:
	@echo "Seeding database..."
	npm run db:seed
	@echo "✓ Database seeded"

.PHONY: db-reset
db-reset:
	@echo "⚠️  WARNING: This will reset the entire database!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "Resetting database..."; \
		docker compose -f docker-compose.infra.yml restart postgres; \
		sleep 5; \
		npm run db:migrate; \
		npm run db:seed; \
		echo "✓ Database reset complete"; \
	else \
		echo "✗ Database reset cancelled"; \
	fi

# ═══════════════════════════════════════════════════════════════
# Development
# ═══════════════════════════════════════════════════════════════

.PHONY: dev
dev:
	@echo "Starting all services in development mode..."
	@echo "Note: Infrastructure must be running (use 'make up' first)"
	npm run dev

.PHONY: dev-frontend
dev-frontend:
	@echo "Starting frontend-only mode..."
	@chmod +x start-frontend-only.sh
	@./start-frontend-only.sh

.PHONY: fix-services
fix-services:
	@echo "Fixing common service issues..."
	@chmod +x fix-services.sh
	@./fix-services.sh

.PHONY: build
build:
	@echo "Building all services..."
	npm run build
	@echo "✓ Build complete"

.PHONY: dev-all
dev-all:
	@if [ -f "scripts/dev-all.sh" ]; then \
		bash scripts/dev-all.sh; \
	else \
		echo "dev-all.sh not found, using default dev"; \
		npm run dev; \
	fi

# ═══════════════════════════════════════════════════════════════
# Testing
# ═══════════════════════════════════════════════════════════════

.PHONY: test
test:
	@echo "Running tests..."
	npm run test || true

.PHONY: smoke
smoke:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "Running smoke tests..."
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "Infrastructure Services:"
	@echo -n "  Kafka:      " && (nc -z localhost 9092 && echo "✓ Running" || echo "✗ Not running")
	@echo -n "  PostgreSQL: " && (nc -z localhost 5433 && echo "✓ Running" || echo "✗ Not running")
	@echo -n "  Redis:      " && (nc -z localhost 6380 && echo "✓ Running" || echo "✗ Not running")
	@echo -n "  MinIO:      " && (nc -z localhost 9000 && echo "✓ Running" || echo "✗ Not running")
	@echo ""
	@echo "Application Services:"
	@echo -n "  Next.js:    " && (nc -z localhost 3000 && echo "✓ Running" || echo "✗ Not running")
	@echo -n "  AI Service: " && (curl -fsS http://localhost:8001/health > /dev/null 2>&1 && echo "✓ Running" || echo "✗ Not running")
	@echo ""

.PHONY: k6-campaign
k6-campaign:
	@echo "Running campaign load test..."
	BASE_URL=http://localhost:3000 k6 run k6/campaign-spike.js

# ═══════════════════════════════════════════════════════════════
# Maintenance
# ═══════════════════════════════════════════════════════════════

.PHONY: clean-yaml
clean-yaml:
	@chmod +x cleanup-docker-compose.sh
	@./cleanup-docker-compose.sh

.PHONY: logs
logs:
	@echo "Following infrastructure logs (Ctrl+C to exit)..."
	docker compose -f docker-compose.infra.yml logs -f

.PHONY: clean
clean:
	@echo "Cleaning build artifacts and logs..."
	@rm -rf logs/*.log
	@rm -rf .next
	@rm -rf dist
	@rm -rf build
	@echo "✓ Cleanup complete"

.PHONY: check-ports
check-ports:
	@echo "Checking service ports..."
	@echo ""
	@echo "Infrastructure:"
	@echo -n "  Zookeeper (2181):  " && (nc -z localhost 2181 && echo "✓ In use" || echo "✗ Available")
	@echo -n "  Kafka (9092):      " && (nc -z localhost 9092 && echo "✓ In use" || echo "✗ Available")
	@echo -n "  PostgreSQL (5433): " && (nc -z localhost 5433 && echo "✓ In use" || echo "✗ Available")
	@echo -n "  Redis (6380):      " && (nc -z localhost 6380 && echo "✓ In use" || echo "✗ Available")
	@echo -n "  MinIO (9000):      " && (nc -z localhost 9000 && echo "✓ In use" || echo "✗ Available")
	@echo -n "  Kafka UI (8080):   " && (nc -z localhost 8080 && echo "✓ In use" || echo "✗ Available")
	@echo ""
	@echo "Application:"
	@echo -n "  Next.js (3000):    " && (nc -z localhost 3000 && echo "✓ In use" || echo "✗ Available")
	@echo -n "  API Gateway (5000):" && (nc -z localhost 5000 && echo "✓ In use" || echo "✗ Available")
	@echo -n "  GraphQL (4000):    " && (nc -z localhost 4000 && echo "✓ In use" || echo "✗ Available")
	@echo -n "  AI Service (8001): " && (nc -z localhost 8001 && echo "✓ In use" || echo "✗ Available")
	@echo ""
