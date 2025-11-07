# Changelog

All notable changes to the schema-contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial schema-contracts repository structure
- Comprehensive documentation and governance

## [1.0.0] - 2024-11-07

### Added

#### Core Infrastructure
- Created centralized schema-contracts repository
- Protobuf entity definitions (`proto/entities.proto`)
- Canonical SQL migrations in `sql/` directory
- JSON seed fixtures in `seeders/` directory
- Migration tracking and seeder run tracking tables

#### Entities (Protobuf)
- **Core**: User, Role, AuditLog, Notification
- **Catalog**: Product, Category, Brand, Warehouse, InventoryItem
- **Orders**: Order, OrderItem, Payment, Invoice
- **Customers**: Customer, Prescription, PrescriptionItem

#### Database Migrations
- `000_migration_tracker.sql` - Migration and seeder tracking
- `001_create_core_tables.sql` - Users, roles, audit logs, notifications
- `002_create_catalog_tables.sql` - Products, categories, brands, inventory
- `003_create_orders_payments.sql` - Orders, payments, invoices, prescriptions

#### Tooling
- **Seeder CLI** (Node.js): `bin/seed.js`
  - Seed all fixtures or individual files
  - Dry-run mode for testing
  - Upsert logic for safe re-runs
  - Seeder run tracking
  
- **Seeder CLI** (Python): `bin/seed.py`
  - Python alternative to Node seeder
  - Same functionality as Node version
  
- **Migration Runner**: `bin/migrate.sh`
  - Apply migrations with version tracking
  - Check migration status
  - Create new migrations
  - Reset database (destructive)
  
- **Code Generator**: `codegen/generate.sh`
  - Generate Go, TypeScript, Python from Protobuf
  - Uses Buf CLI for code generation
  - Fallback to protoc if Buf not available

#### Testing
- **Contract Tests**: `tests/contract-tests.js`
  - Validates Proto syntax and structure
  - Checks SQL migration validity
  - Verifies seed data JSON format
  - Ensures entity consistency
  - Validates executable scripts

#### CI/CD
- GitHub Actions workflow for schema validation
- Automated contract testing on PRs
- Breaking change detection with Buf
- Migration and seeder testing with PostgreSQL
- Code generation verification
- Artifact publishing on main branch

#### Documentation
- **README.md** - Quick start and usage guide
- **CONTRACTS.md** - Governance and change management policy
- **CHANGELOG.md** - This file
- Inline documentation in all scripts and migrations

#### Configuration
- `buf.yaml` - Buf configuration for linting and breaking change detection
- `buf.gen.yaml` - Code generation configuration for multiple languages
- `.github/workflows/schema-contracts-ci.yml` - CI/CD pipeline

#### Seed Fixtures
- `roles_seed.json` - Default system roles (6 roles)
- `users_seed.json` - Sample users (4 users)
- `categories_seed.json` - Product categories (7 categories)
- `brands_seed.json` - Homeopathy brands (5 brands)
- `products_seed.json` - Sample products (7 products)
- `warehouses_seed.json` - Warehouses (3 warehouses)
- `customers_seed.json` - Sample customers (3 customers)

### Design Decisions

#### Database-per-Service Pattern
- Each service owns its database for true service isolation
- Canonical contracts generate per-service migrations
- Event-driven sync for cross-service data consistency
- Read models can be materialized for queries

#### Protobuf as Contract Language
- Language-agnostic entity definitions
- Strong typing with code generation
- Built-in backward compatibility checking
- Wide ecosystem support (Go, TS, Python, etc.)

#### Multi-Language Support
- Go: For high-performance services (catalog, inventory)
- TypeScript: For Node.js services (auth, gateway)
- Python: For ML/AI services and admin tools

#### Migration Strategy
- SQL-first approach for database schema
- Version-tracked migrations with checksum validation
- Idempotent seeders with upsert logic
- Support for multi-step breaking changes

### Interview Highlights

This initial release demonstrates:

1. **Architectural Maturity**
   - Single source of truth eliminates schema drift
   - Proper separation of concerns with bounded contexts
   - Event-driven architecture for service decoupling

2. **Production Readiness**
   - Comprehensive testing strategy
   - CI/CD automation for safety
   - Rollback and recovery procedures
   - Monitoring and versioning

3. **Development Velocity**
   - Code generation reduces boilerplate
   - Automated seeders speed up development
   - Contract tests catch issues early
   - Clear governance reduces confusion

4. **Operational Excellence**
   - Migration tracking and audit trails
   - Multiple CLI tools for different use cases
   - Comprehensive documentation
   - Change management processes

### Breaking Changes
None (initial release)

### Migration Guide
For new services integrating with schema-contracts:

1. Add schema-contracts as dependency
2. Run code generation: `./codegen/generate.sh <language>`
3. Copy generated models to service
4. Reference specific version in service.yaml
5. Add update script to service CI/CD

### Known Limitations

- Down migrations not yet implemented (use manual SQL for rollback)
- Generated code not yet published to package registries
- Service compatibility checking not yet automated
- CDC (Change Data Capture) tooling not included

### Future Roadmap

Planned for future releases:

- **v1.1**: Add HR and employee management entities
- **v1.2**: Add analytics and reporting entities
- **v1.3**: Add marketing and campaign entities
- **v2.0**: Introduce gRPC service definitions
- **v2.1**: Add GraphQL schema generation
- **v3.0**: OpenAPI spec generation from Protobuf

### Contributors

- Platform Team
- Database Team
- Architecture Team

---

## Version History

- **v1.0.0** (2024-11-07) - Initial release with full schema infrastructure

---

## How to Use This Changelog

### For Developers
Check this file before updating schema-contracts dependency to understand:
- What changed
- If migration is needed
- Breaking changes to watch for

### For Service Owners
Review this file when:
- Updating to new schema version
- Planning integration with new entities
- Understanding compatibility requirements

### For Platform Team
Update this file for:
- Every schema version release
- All breaking changes
- Important bug fixes
- New features or entities

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Customer.loyalty_points field
fix: correct Product.stock default value
docs: update migration guide
chore: update dependencies
BREAKING CHANGE: remove deprecated User.legacy_id field
```

---

**Maintained by**: Platform Team  
**Contact**: #platform-schemas on Slack
