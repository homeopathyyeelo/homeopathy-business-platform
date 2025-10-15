SHELL := /usr/bin/bash

.PHONY: help
help:
	@echo "Targets:"
	@echo "  up            - Start local infra (kafka, postgres, redis)"
	@echo "  down          - Stop local infra"
	@echo "  db-generate   - Prisma generate"
	@echo "  db-migrate    - Prisma migrate"
	@echo "  db-seed       - Seed database"
	@echo "  dev           - Run all services in dev via turbo"
	@echo "  build         - Build all services via turbo"
	@echo "  test          - Run tests"
	@echo "  k6-campaign   - Run campaign spike k6 test"
	@echo "  quickstart    - One-click start, migrate, seed, smoke test"
	@echo "  smoke         - Run module smoke tests"
	@echo "  dev-all       - Start Next.js + Nest dev with hot reload"

.PHONY: up
down:
	docker compose -f docker-compose.kafka.yml down || true
	docker compose -f docker-compose.dev.yml down || true

.PHONY: up
up:
	docker compose -f docker-compose.kafka.yml up -d
	docker compose -f docker-compose.dev.yml up -d

.PHONY: db-generate
db-generate:
	npm run db:generate

.PHONY: db-migrate
db-migrate:
	npm run db:migrate

.PHONY: db-seed
db-seed:
	npm run db:seed

.PHONY: dev
dev:
	npm run dev

.PHONY: build
build:
	npm run build

.PHONY: test
test:
	npm run test || true

.PHONY: quickstart
quickstart:
	bash scripts/quickstart.sh

.PHONY: smoke
smoke:
	@echo "AI service health:" && curl -fsS http://localhost:8001/health || true && echo
	@echo "AI models:" && curl -fsS http://localhost:8001/v1/models || true && echo

.PHONY: dev-all
dev-all:
	bash scripts/dev-all.sh

.PHONY: k6-campaign
k6-campaign:
	BASE_URL=http://localhost:3000 k6 run k6/campaign-spike.js
