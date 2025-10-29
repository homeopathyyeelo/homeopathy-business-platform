.PHONY: help build run test clean migrate-up migrate-down docker-build docker-run lint format

# Variables
APP_NAME=erp-api
VERSION=$(shell git describe --tags --always --dirty)
BUILD_DIR=bin
GO_FILES=$(shell find . -name '*.go' -not -path "./vendor/*")
MAIN_PATH=./cmd/api/main.go

# Colors for output
BLUE=\033[0;34m
GREEN=\033[0;32m
RED=\033[0;31m
NC=\033[0m # No Color

help: ## Show this help message
	@echo '$(BLUE)Available targets:$(NC)'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

build: ## Build the application
	@echo "$(BLUE)Building $(APP_NAME)...$(NC)"
	@mkdir -p $(BUILD_DIR)
	@go build -ldflags="-X main.version=$(VERSION)" -o $(BUILD_DIR)/$(APP_NAME) $(MAIN_PATH)
	@echo "$(GREEN)✓ Build complete: $(BUILD_DIR)/$(APP_NAME)$(NC)"

run: ## Run the application
	@echo "$(BLUE)Starting $(APP_NAME)...$(NC)"
	@go run $(MAIN_PATH)

run-watch: ## Run with auto-reload (requires air)
	@echo "$(BLUE)Starting $(APP_NAME) with auto-reload...$(NC)"
	@air

test: ## Run tests
	@echo "$(BLUE)Running tests...$(NC)"
	@go test -v -race -coverprofile=coverage.txt -covermode=atomic ./...
	@echo "$(GREEN)✓ Tests complete$(NC)"

test-coverage: test ## Run tests with coverage report
	@go tool cover -html=coverage.txt -o coverage.html
	@echo "$(GREEN)✓ Coverage report generated: coverage.html$(NC)"

clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning...$(NC)"
	@rm -rf $(BUILD_DIR)
	@rm -f coverage.txt coverage.html
	@rm -f main api-golang test_unified_schema verify_schema
	@echo "$(GREEN)✓ Clean complete$(NC)"

lint: ## Run linter
	@echo "$(BLUE)Running linter...$(NC)"
	@golangci-lint run --timeout=5m
	@echo "$(GREEN)✓ Lint complete$(NC)"

format: ## Format code
	@echo "$(BLUE)Formatting code...$(NC)"
	@gofmt -s -w $(GO_FILES)
	@goimports -w $(GO_FILES)
	@echo "$(GREEN)✓ Format complete$(NC)"

migrate-up: ## Run database migrations up
	@echo "$(BLUE)Running migrations up...$(NC)"
	@go run cmd/migrate/main.go up
	@echo "$(GREEN)✓ Migrations complete$(NC)"

migrate-down: ## Run database migrations down
	@echo "$(BLUE)Running migrations down...$(NC)"
	@go run cmd/migrate/main.go down
	@echo "$(GREEN)✓ Rollback complete$(NC)"

migrate-create: ## Create new migration (use: make migrate-create name=create_users)
	@echo "$(BLUE)Creating migration: $(name)...$(NC)"
	@migrate create -ext sql -dir migrations -seq $(name)
	@echo "$(GREEN)✓ Migration created$(NC)"

seed: ## Seed database
	@echo "$(BLUE)Seeding database...$(NC)"
	@go run cmd/seed/main.go
	@echo "$(GREEN)✓ Seed complete$(NC)"

docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	@docker build -t $(APP_NAME):$(VERSION) -t $(APP_NAME):latest .
	@echo "$(GREEN)✓ Docker build complete$(NC)"

docker-run: ## Run Docker container
	@echo "$(BLUE)Running Docker container...$(NC)"
	@docker run -p 3005:3005 --env-file .env $(APP_NAME):latest

docker-compose-up: ## Start services with docker-compose
	@echo "$(BLUE)Starting services...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Services started$(NC)"

docker-compose-down: ## Stop services with docker-compose
	@echo "$(BLUE)Stopping services...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

deps: ## Download dependencies
	@echo "$(BLUE)Downloading dependencies...$(NC)"
	@go mod download
	@go mod tidy
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

deps-upgrade: ## Upgrade dependencies
	@echo "$(BLUE)Upgrading dependencies...$(NC)"
	@go get -u ./...
	@go mod tidy
	@echo "$(GREEN)✓ Dependencies upgraded$(NC)"

install-tools: ## Install development tools
	@echo "$(BLUE)Installing tools...$(NC)"
	@go install github.com/cosmtrek/air@latest
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install golang.org/x/tools/cmd/goimports@latest
	@echo "$(GREEN)✓ Tools installed$(NC)"

dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	@docker-compose up -d postgres redis
	@sleep 2
	@make migrate-up
	@make run-watch

prod-build: clean ## Production build with optimizations
	@echo "$(BLUE)Building for production...$(NC)"
	@mkdir -p $(BUILD_DIR)
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
		-ldflags="-w -s -X main.version=$(VERSION)" \
		-o $(BUILD_DIR)/$(APP_NAME) $(MAIN_PATH)
	@echo "$(GREEN)✓ Production build complete$(NC)"

health-check: ## Check if the service is running
	@curl -f http://localhost:3005/health || echo "$(RED)Service is not running$(NC)"

swagger: ## Generate Swagger documentation
	@echo "$(BLUE)Generating Swagger docs...$(NC)"
	@swag init -g $(MAIN_PATH) -o ./docs
	@echo "$(GREEN)✓ Swagger docs generated$(NC)"

all: clean deps format lint test build ## Run all checks and build

.DEFAULT_GOAL := help
