# Schema Contracts

**Centralized schema definitions, migrations, and data contracts for the Homeopathy Business Platform**

## 🎯 Purpose

This repository serves as the **single source of truth** for all data schemas, entities, and contracts across our microservices architecture. It eliminates schema drift, ensures consistency, and provides production-ready tooling for migrations and seeding.

## 📁 Structure

```
schema-contracts/
├── proto/              # Protobuf definitions (canonical entities)
│   └── entities.proto
├── sql/                # SQL migration files
│   ├── 000_migration_tracker.sql
│   ├── 001_create_core_tables.sql
│   ├── 002_create_catalog_tables.sql
│   └── 003_create_orders_payments.sql
├── seeders/            # JSON seed fixtures
│   ├── roles_seed.json
│   ├── users_seed.json
│   ├── categories_seed.json
│   ├── brands_seed.json
│   ├── products_seed.json
│   ├── warehouses_seed.json
│   └── customers_seed.json
├── bin/                # CLI tools
│   ├── seed.js         # Node.js seeder
│   ├── seed.py         # Python seeder
│   └── migrate.sh      # Migration runner
├── codegen/            # Code generation scripts
│   └── generate.sh
├── tests/              # Contract tests
│   └── contract-tests.js
├── gen/                # Generated code (gitignored)
│   ├── go/
│   ├── ts/
│   └── python/
└── .github/workflows/  # CI/CD pipelines
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for seeders and tooling)
- **PostgreSQL** 13+ (database)
- **Buf CLI** (for protobuf codegen) - Install: https://buf.build/docs/installation
- **Go** 1.21+ (for Go code generation)
- **Python** 3.9+ (for Python seeder)

### Installation

```bash
# Install Node.js dependencies
npm install pg

# Install Python dependencies
pip install psycopg2-binary

# Install Buf (if not already installed)
# macOS
brew install bufbuild/buf/buf

# Linux
curl -sSL "https://github.com/bufbuild/buf/releases/download/v1.28.1/buf-$(uname -s)-$(uname -m)" \
  -o "/usr/local/bin/buf" && chmod +x "/usr/local/bin/buf"
```

### Usage

#### 1. Run Migrations

```bash
# Set database URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"

# Apply all migrations
./bin/migrate.sh up

# Check migration status
./bin/migrate.sh status

# Create new migration
./bin/migrate.sh create add_new_table
```

#### 2. Seed Data

```bash
# Seed all fixtures (dry-run first)
node bin/seed.js --db "$DATABASE_URL" --all --dry-run

# Seed all fixtures
node bin/seed.js --db "$DATABASE_URL" --all

# Seed specific fixture
node bin/seed.js --db "$DATABASE_URL" --fixtures seeders/users_seed.json

# Using Python seeder
python bin/seed.py --db "$DATABASE_URL" --all
```

#### 3. Generate Code from Protobuf

```bash
# Generate all languages (Go, TypeScript, Python)
./codegen/generate.sh all

# Generate specific language
./codegen/generate.sh go
./codegen/generate.sh ts
./codegen/generate.sh python

# Using Buf directly
buf generate
```

#### 4. Run Contract Tests

```bash
# Run contract validation tests
node tests/contract-tests.js
```

## 📦 Canonical Entities

All entities are defined in `proto/entities.proto`:

- **Core**: User, Role, AuditLog
- **Catalog**: Product, Category, Brand, Warehouse, InventoryItem
- **Orders**: Order, OrderItem, Payment, Invoice
- **Customers**: Customer, Prescription, PrescriptionItem
- **Notifications**: Notification

## 🔄 Workflow

### For Schema Changes

1. **Update Protobuf** in `proto/entities.proto`
2. **Create SQL Migration** in `sql/` directory
3. **Update Seed Fixtures** if needed
4. **Run Contract Tests** to validate
5. **Generate Code** for all languages
6. **Open PR** - CI will check for breaking changes
7. **Merge** - Code is auto-generated and published

### For Services Consuming Schemas

```bash
# In each service, add update script
# services/my-service/scripts/update-from-schema.sh

#!/bin/bash
cd ../../schema-contracts
git pull origin main
./codegen/generate.sh go  # or ts, python

# Copy generated code to service
cp -r gen/go/* ../my-service/internal/models/
```

## 🎨 Architecture Pattern

We use **Database-per-Service** with **Canonical Contract** pattern:

- Each service owns its database
- Canonical entities defined here generate per-service DTOs
- Services use events for cross-service data sync
- Read models can be materialized for queries

## 🔐 Change Governance

### Versioning

We use semantic versioning:
- **Major**: Breaking changes (field removal, type change)
- **Minor**: Additive changes (new fields, new entities)
- **Patch**: Documentation, fixes, seed data updates

### Breaking Change Process

Breaking changes require multi-step rollout:

1. **Add new field** (backward compatible)
2. **Deploy services** to write both fields
3. **Migrate data** from old to new
4. **Update services** to read new field only
5. **Remove old field** in final release

See `CONTRACTS.md` for full governance rules.

## 🧪 Testing Strategy

### Contract Tests

Automated tests verify:
- Protobuf syntax and structure
- SQL migration validity
- Seed data JSON format
- Entity consistency across languages
- Breaking change detection

### CI/CD Pipeline

On every PR:
1. ✓ Lint protobuf schemas
2. ✓ Detect breaking changes
3. ✓ Validate SQL migrations
4. ✓ Test seeders in temp database
5. ✓ Generate code for all languages
6. ✓ Run contract tests

## 📚 Documentation

- **README.md** (this file) - Usage and quick start
- **CONTRACTS.md** - Governance and change management
- **CHANGELOG.md** - Version history

## 🛠️ Tooling

### Migration Runner (`bin/migrate.sh`)

```bash
./bin/migrate.sh up          # Apply migrations
./bin/migrate.sh down         # Rollback (manual)
./bin/migrate.sh status       # Show status
./bin/migrate.sh create name  # Create migration
./bin/migrate.sh reset        # Reset DB (destructive)
```

### Seeder CLI (`bin/seed.js` / `bin/seed.py`)

```bash
node bin/seed.js --db URL --all           # Seed all
node bin/seed.js --db URL --fixtures FILE # Seed specific
python bin/seed.py --db URL --all         # Python version
```

### Code Generator (`codegen/generate.sh`)

```bash
./codegen/generate.sh all     # All languages
./codegen/generate.sh go      # Go only
./codegen/generate.sh ts      # TypeScript only
./codegen/generate.sh python  # Python only
```

## 🎯 Interview Talking Points

**Q: How do you handle schema drift across microservices?**

A: We use a centralized schema-contracts repository with Protobuf definitions as the single source of truth. Code generation produces language-specific DTOs, and CI enforces contract tests. Each service references a specific version, ensuring controlled evolution.

**Q: How do you manage database migrations in distributed systems?**

A: Canonical SQL migrations in schema-contracts generate per-service migrations. We use backward-compatible multi-step rollouts for breaking changes. Migration tracking tables record applied versions. Services can lag behind by one version during deployments.

**Q: How do you ensure data consistency between services?**

A: Database-per-service pattern with event-driven eventual consistency. Critical transactions use saga pattern. Read models are materialized from events. Schema contracts enforce consistency at the API boundary.

**Q: How do you handle breaking changes?**

A: Multi-step process: (1) Add new field, (2) Deploy dual-write, (3) Migrate data, (4) Update readers, (5) Remove old field. CI detects breaking changes via `buf breaking`. All changes require migration plan in PR.

## 🤝 Contributing

1. Fork and create feature branch
2. Make schema changes following governance rules
3. Update migrations and seed data
4. Run tests: `node tests/contract-tests.js`
5. Generate code: `./codegen/generate.sh all`
6. Submit PR with migration plan

## 📄 License

Proprietary - Homeopathy Business Platform

## 🔗 Related Services

- `services/auth-service` - Authentication (Node/Nest)
- `services/api-golang-master` - Catalog (Go)
- `services/order-service` - Orders (Python)
- `services/notification-service` - Notifications (Python)

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintainer**: Platform Team
