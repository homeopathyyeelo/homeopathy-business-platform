# Schema Contracts - Governance & Change Management

## Overview

This document defines the governance, versioning, and change management policies for the schema-contracts repository. All schema changes must follow these rules to maintain system stability and backward compatibility.

## Principles

1. **Single Source of Truth**: All entity definitions originate from this repository
2. **Backward Compatibility**: Changes must not break existing services
3. **Explicit Breaking Changes**: Breaking changes require formal migration plan
4. **Version Everything**: All contracts are versioned and tracked
5. **Test First**: Changes must pass contract tests before merge

## Schema Versioning

### Version Format

We use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (field removal, type changes, renames)
- **MINOR**: Additive changes (new fields, new entities, new tables)
- **PATCH**: Non-functional changes (docs, seed data, comments)

### Current Version

Version is tracked in:
- Git tags: `v1.0.0`, `v1.1.0`, etc.
- `contract_versions` table in database
- Release artifacts

## Change Categories

### ✅ Safe Changes (Minor/Patch)

These changes are **backward compatible** and can be deployed immediately:

#### Protobuf
- Adding new optional fields
- Adding new messages
- Adding new enums or enum values (at the end)
- Deprecating fields (with comment)

#### SQL
- Adding new tables
- Adding new columns with DEFAULT values
- Adding indexes
- Adding non-breaking constraints

#### Seed Data
- Adding new seed records
- Updating non-critical data
- Fixing typos in seed values

### ⚠️ Breaking Changes (Major)

These changes **break backward compatibility** and require migration plan:

#### Protobuf
- Removing fields
- Changing field types
- Changing field numbers
- Renaming fields
- Changing message names
- Making optional fields required

#### SQL
- Dropping tables
- Dropping columns
- Changing column types (non-compatible)
- Adding NOT NULL to existing columns
- Changing primary/foreign keys

## Breaking Change Process

### Multi-Step Migration

All breaking changes must use this phased approach:

#### Phase 1: Additive (Week 1)
```protobuf
// Before (v1.0)
message User {
  string email = 1;
}

// Phase 1: Add new field (v1.1)
message User {
  string email = 1;          // deprecated
  string email_address = 2;  // new field
}
```

```sql
-- Phase 1 Migration
ALTER TABLE users ADD COLUMN email_address TEXT;
UPDATE users SET email_address = email WHERE email_address IS NULL;
```

**Actions**:
- Deploy schema v1.1 to all environments
- Services continue using old field
- Compatibility: v1.0 and v1.1 services can coexist

#### Phase 2: Dual Write (Week 2)
```typescript
// Service updates to write both fields
await db.users.update({
  email: value,          // old field
  email_address: value   // new field
});
```

**Actions**:
- Deploy service changes to write both fields
- Verify all writes populate new field
- Run data migration to backfill old records

#### Phase 3: Dual Read (Week 3)
```typescript
// Service reads new field, falls back to old
const email = user.email_address || user.email;
```

**Actions**:
- Deploy service changes to prefer new field
- Monitor for any null/missing values
- Ensure 100% data coverage

#### Phase 4: Cleanup (Week 4)
```protobuf
// Final: Remove old field (v2.0)
message User {
  string email_address = 2;
}
```

```sql
-- Phase 4 Migration
ALTER TABLE users DROP COLUMN email;
```

**Actions**:
- Deploy schema v2.0
- Remove old field from services
- Complete migration

### Migration Plan Template

All breaking change PRs must include:

```markdown
## Breaking Change Migration Plan

### Summary
- Field being changed: `User.email` -> `User.email_address`
- Affected services: auth-service, user-service, notification-service
- Estimated timeline: 4 weeks

### Phase 1: Additive Change
- [ ] Add new field to protobuf
- [ ] Create SQL migration to add column
- [ ] Deploy schema v1.1
- [ ] ETA: Week 1

### Phase 2: Dual Write
- [ ] Update auth-service to write both fields
- [ ] Update user-service to write both fields
- [ ] Run backfill migration
- [ ] ETA: Week 2

### Phase 3: Dual Read
- [ ] Update all services to read new field
- [ ] Monitor metrics for missing values
- [ ] ETA: Week 3

### Phase 4: Cleanup
- [ ] Remove old field from protobuf
- [ ] Drop old column in SQL
- [ ] Deploy schema v2.0
- [ ] ETA: Week 4

### Rollback Plan
- If issues in Phase 2-3: Stop dual write, use old field only
- If issues in Phase 4: Re-add old field, revert to Phase 3

### Testing
- [ ] Contract tests pass
- [ ] Integration tests with all affected services
- [ ] Load test with dual write/read
```

## Change Workflow

### 1. Propose Change

Create GitHub issue with:
- **Type**: Breaking / Non-breaking
- **Rationale**: Why is this change needed?
- **Impact**: Which services are affected?
- **Migration Plan**: For breaking changes

### 2. Review Process

All changes require:
- ✅ Approval from 2+ platform engineers
- ✅ For breaking changes: Approval from affected service owners
- ✅ Contract tests passing
- ✅ Breaking change detection reviewed

### 3. Implementation

```bash
# Create feature branch
git checkout -b feature/add-user-phone-field

# Make changes
vim proto/entities.proto
vim sql/004_add_user_phone.sql

# Run tests
node tests/contract-tests.js

# Generate code
./codegen/generate.sh all

# Commit with conventional commit format
git commit -m "feat: add phone field to User entity"
```

### 4. CI/CD Checks

Automated checks on PR:
- Protobuf lint
- Breaking change detection (`buf breaking`)
- SQL validation
- Seed data validation
- Contract tests
- Code generation

### 5. Merge & Deploy

- Merge to `main` triggers:
  - Version tag creation
  - Code generation
  - Artifact publication
  - Service notifications

## Version Compatibility Matrix

Services declare supported schema version:

```yaml
# service.yaml
schema_contract:
  version: "v1.2.0"
  min_version: "v1.0.0"
```

Compatibility rules:
- Services must support at least previous minor version
- Major version changes require all services to update
- CI fails if service compatibility is broken

## Contract Testing

### Required Tests

All changes must pass:

1. **Proto Validation**: Syntax, naming conventions
2. **Breaking Change Detection**: `buf breaking` against main
3. **SQL Validation**: Migration files apply cleanly
4. **Seed Data Validation**: JSON format, required fixtures
5. **Cross-Language Generation**: Go, TS, Python compile
6. **Entity Consistency**: Proto matches SQL matches seeds

### Test Execution

```bash
# Run all contract tests
node tests/contract-tests.js

# Run specific test suite
buf breaking --against '.git#branch=main'

# Test migrations
./bin/migrate.sh up --db "test_db_url"

# Test seeders
node bin/seed.js --db "test_db_url" --all --dry-run
```

## Notifications

### On Schema Change

Automatic notifications sent to:
- #platform-schemas Slack channel
- Service owners (via CODEOWNERS)
- API gateway team (for public APIs)

### Notification Template

```
🔔 Schema Contract Update: v1.3.0

Changes:
- Added: Product.brand_id field
- Added: brands table migration
- Updated: brands seed data

Type: Minor (Non-breaking)
Services Affected: catalog-service, inventory-service

Action Required:
- Update schema version in service.yaml
- Run: ./scripts/update-from-schema.sh
- Redeploy service

Documentation: https://github.com/.../pull/123
```

## Service Integration Guide

### Consuming Schema Contracts

Each service should:

1. **Reference specific version**:
```json
{
  "dependencies": {
    "schema-contracts": "v1.2.0"
  }
}
```

2. **Auto-update script**:
```bash
# services/my-service/scripts/update-schema.sh
#!/bin/bash
cd ../../schema-contracts
git fetch && git checkout v1.2.0
./codegen/generate.sh go
cp -r gen/go/* ../my-service/internal/models/
```

3. **CI check for compatibility**:
```yaml
- name: Check schema compatibility
  run: |
    ./scripts/check-schema-version.sh
```

## Deprecation Policy

### Deprecation Timeline

Deprecated fields follow this timeline:

1. **Announce** (v1.1): Add deprecation comment
   ```protobuf
   string old_field = 1 [deprecated = true];  // Use new_field instead
   ```

2. **Warn** (v1.2 - v1.5): Runtime warnings when used
3. **Remove** (v2.0): Field removed in next major version

Minimum deprecation period: **3 months** or **3 minor versions**

### Deprecation Process

```markdown
## Deprecation Notice

Field: `User.legacy_id`
Deprecated in: v1.3.0
Removal target: v2.0.0
Replacement: `User.id` (UUID)

Migration guide: docs/migrations/legacy-id-to-uuid.md
```

## Emergency Changes

### Hotfix Process

For critical bugs or security issues:

1. Create hotfix branch from main
2. Make minimal change to fix issue
3. Fast-track review (1 approver minimum)
4. Deploy immediately with rollback plan
5. Document as technical debt for proper fix

### Rollback Procedure

If schema change causes issues:

```bash
# Revert to previous version
git revert <commit-hash>

# Rollback database (if needed)
./bin/migrate.sh down

# Notify all services
# Services should pin to previous schema version
```

## Metrics & Monitoring

Track schema health:

- **Schema version adoption**: Which services use which version
- **Migration success rate**: % of migrations applied successfully
- **Breaking change frequency**: Count per quarter
- **Time to propagate**: Schema change to all services updated
- **Contract test coverage**: % of entities with tests

## Questions & Support

- **Slack**: #platform-schemas
- **Email**: platform-team@homeopathy.com
- **Docs**: https://docs.internal/schema-contracts
- **Office Hours**: Wednesdays 2-3pm

## Appendix

### Useful Commands

```bash
# Check current schema version
git describe --tags --abbrev=0

# List applied migrations
./bin/migrate.sh status --db "$DATABASE_URL"

# Validate breaking changes
buf breaking --against '.git#branch=main'

# Test schema locally
docker-compose -f docker-compose.test.yml up
./bin/migrate.sh up --db "postgres://test"
node bin/seed.js --db "postgres://test" --all
```

### References

- [Buf Style Guide](https://buf.build/docs/best-practices/style-guide)
- [Protobuf Language Guide](https://protobuf.dev/programming-guides/proto3/)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/)
- [Semantic Versioning](https://semver.org/)

---

**Document Version**: 1.0.0  
**Last Updated**: 2024  
**Owner**: Platform Team
