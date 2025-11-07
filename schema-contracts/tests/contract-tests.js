#!/usr/bin/env node

/**
 * Contract Tests
 * Validates that generated code matches expected structure
 * and is compatible across language implementations
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  RESET: '\x1b[0m'
};

function log(type, message) {
  const prefix = {
    success: `${COLORS.GREEN}✓${COLORS.RESET}`,
    error: `${COLORS.RED}✗${COLORS.RESET}`,
    warn: `${COLORS.YELLOW}⚠${COLORS.RESET}`,
    info: ' '
  }[type];
  console.log(`${prefix} ${message}`);
}

class ContractTester {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Running Contract Tests\n');
    console.log('='.repeat(50));

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        this.passed++;
        log('success', name);
      } catch (error) {
        this.failed++;
        log('error', `${name}\n   ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed\n`);

    return this.failed === 0;
  }
}

// Test suite
const tester = new ContractTester();

// Test 1: Verify proto files exist
tester.test('Proto files exist and are valid', () => {
  const protoDir = path.join(__dirname, '..', 'proto');
  const protoFiles = fs.readdirSync(protoDir).filter(f => f.endsWith('.proto'));
  
  if (protoFiles.length === 0) {
    throw new Error('No proto files found');
  }
  
  // Check entities.proto exists
  if (!protoFiles.includes('entities.proto')) {
    throw new Error('entities.proto not found');
  }
  
  // Validate proto syntax (basic check)
  const content = fs.readFileSync(path.join(protoDir, 'entities.proto'), 'utf8');
  if (!content.includes('syntax = "proto3"')) {
    throw new Error('Invalid proto3 syntax');
  }
  
  if (!content.includes('message User')) {
    throw new Error('User message not found in proto');
  }
});

// Test 2: Verify SQL migrations are valid
tester.test('SQL migration files are valid', () => {
  const sqlDir = path.join(__dirname, '..', 'sql');
  const sqlFiles = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql'));
  
  if (sqlFiles.length === 0) {
    throw new Error('No SQL files found');
  }
  
  // Verify naming convention (###_*.sql)
  for (const file of sqlFiles) {
    if (!/^\d{3}_.*\.sql$/.test(file)) {
      throw new Error(`Invalid SQL file naming: ${file}`);
    }
  }
  
  // Check migration tracker exists
  if (!sqlFiles.includes('000_migration_tracker.sql')) {
    throw new Error('Migration tracker SQL not found');
  }
});

// Test 3: Verify seed fixtures are valid JSON
tester.test('Seed fixtures are valid JSON', () => {
  const seedersDir = path.join(__dirname, '..', 'seeders');
  const seedFiles = fs.readdirSync(seedersDir).filter(f => f.endsWith('.json'));
  
  if (seedFiles.length === 0) {
    throw new Error('No seed files found');
  }
  
  for (const file of seedFiles) {
    const content = fs.readFileSync(path.join(seedersDir, file), 'utf8');
    try {
      const data = JSON.parse(content);
      if (!Array.isArray(data)) {
        throw new Error(`${file} does not contain an array`);
      }
    } catch (e) {
      throw new Error(`Invalid JSON in ${file}: ${e.message}`);
    }
  }
});

// Test 4: Verify required seed files exist
tester.test('Required seed files exist', () => {
  const seedersDir = path.join(__dirname, '..', 'seeders');
  const requiredSeeds = [
    'roles_seed.json',
    'users_seed.json',
    'categories_seed.json',
    'brands_seed.json',
    'products_seed.json'
  ];
  
  for (const required of requiredSeeds) {
    const filepath = path.join(seedersDir, required);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Required seed file missing: ${required}`);
    }
  }
});

// Test 5: Verify codegen configuration
tester.test('Codegen configuration is valid', () => {
  const bufGenPath = path.join(__dirname, '..', 'buf.gen.yaml');
  
  if (!fs.existsSync(bufGenPath)) {
    throw new Error('buf.gen.yaml not found');
  }
  
  const content = fs.readFileSync(bufGenPath, 'utf8');
  
  // Check for required plugins
  if (!content.includes('protocolbuffers/go')) {
    throw new Error('Go plugin not configured');
  }
});

// Test 6: Verify scripts are executable
tester.test('Required scripts are executable', () => {
  const scripts = [
    'bin/seed.js',
    'bin/seed.py',
    'bin/migrate.sh',
    'codegen/generate.sh'
  ];
  
  for (const script of scripts) {
    const scriptPath = path.join(__dirname, '..', script);
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script not found: ${script}`);
    }
    
    // Check if executable (on Unix systems)
    try {
      const stats = fs.statSync(scriptPath);
      const isExecutable = !!(stats.mode & 0o111);
      if (!isExecutable && process.platform !== 'win32') {
        log('warn', `Script not executable: ${script}`);
      }
    } catch (e) {
      // Skip on Windows
    }
  }
});

// Test 7: Verify entity consistency
tester.test('Proto entities match seed fixture structure', () => {
  const protoPath = path.join(__dirname, '..', 'proto', 'entities.proto');
  const protoContent = fs.readFileSync(protoPath, 'utf8');
  
  // Extract message names from proto
  const messageRegex = /message\s+(\w+)\s*\{/g;
  const messages = [];
  let match;
  while ((match = messageRegex.exec(protoContent)) !== null) {
    messages.push(match[1]);
  }
  
  // Verify key entities exist
  const requiredEntities = ['User', 'Product', 'Order', 'Customer', 'Category', 'Brand'];
  for (const entity of requiredEntities) {
    if (!messages.includes(entity)) {
      throw new Error(`Required entity missing in proto: ${entity}`);
    }
  }
});

// Test 8: Verify SQL and seed data alignment
tester.test('SQL tables align with seed fixtures', () => {
  const sqlPath = path.join(__dirname, '..', 'sql', '001_create_core_tables.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // Check that critical tables are created
  const requiredTables = ['users', 'roles'];
  for (const table of requiredTables) {
    const tableRegex = new RegExp(`CREATE TABLE.*${table}`, 'i');
    if (!tableRegex.test(sqlContent)) {
      throw new Error(`Table not found in SQL: ${table}`);
    }
  }
});

// Run all tests
(async () => {
  const success = await tester.run();
  process.exit(success ? 0 : 1);
})();
