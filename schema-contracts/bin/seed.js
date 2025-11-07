#!/usr/bin/env node

/**
 * Seeder CLI
 * Usage: node bin/seed.js --db "postgres://..." --fixtures seeders/users_seed.json
 *        node bin/seed.js --db "postgres://..." --all
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : null;
};

const DATABASE_URL = getArg('--db') || process.env.DATABASE_URL;
const FIXTURES_PATH = getArg('--fixtures');
const SEED_ALL = args.includes('--all');
const DRY_RUN = args.includes('--dry-run');

if (!DATABASE_URL) {
  console.error('❌ Error: Database URL is required. Use --db flag or set DATABASE_URL env variable');
  process.exit(1);
}

if (!FIXTURES_PATH && !SEED_ALL) {
  console.error('❌ Error: Either --fixtures or --all flag is required');
  console.log('\nUsage:');
  console.log('  node bin/seed.js --db "postgres://..." --fixtures seeders/users_seed.json');
  console.log('  node bin/seed.js --db "postgres://..." --all');
  console.log('  node bin/seed.js --db "postgres://..." --all --dry-run');
  process.exit(1);
}

// Table configuration mapping
const TABLE_CONFIGS = {
  roles: {
    table: 'roles',
    idField: 'id',
    fields: ['id', 'name', 'description', 'permissions']
  },
  users: {
    table: 'users',
    idField: 'id',
    fields: ['id', 'email', 'phone', 'display_name', 'roles', 'is_active', 'avatar_url', 'password_hash']
  },
  categories: {
    table: 'categories',
    idField: 'id',
    fields: ['id', 'name', 'description', 'parent_id', 'sort_order', 'is_active']
  },
  brands: {
    table: 'brands',
    idField: 'id',
    fields: ['id', 'name', 'description', 'logo_url', 'is_active']
  },
  products: {
    table: 'products',
    idField: 'id',
    fields: ['id', 'sku', 'name', 'description', 'category_id', 'subcategory_id', 'brand_id', 'price', 'mrp', 'stock', 'unit', 'potency', 'size', 'is_active']
  },
  warehouses: {
    table: 'warehouses',
    idField: 'id',
    fields: ['id', 'name', 'code', 'address', 'city', 'state', 'pincode', 'is_active']
  },
  customers: {
    table: 'customers',
    idField: 'id',
    fields: ['id', 'customer_code', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'address', 'city', 'state', 'pincode', 'blood_group', 'allergies', 'is_active']
  }
};

// Determine seed order (respects foreign key dependencies)
const SEED_ORDER = [
  'roles_seed.json',
  'users_seed.json',
  'categories_seed.json',
  'brands_seed.json',
  'warehouses_seed.json',
  'products_seed.json',
  'customers_seed.json'
];

async function seedTable(client, tableName, records, config) {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  console.log(`\n📦 Seeding ${tableName} (${records.length} records)...`);

  for (const record of records) {
    try {
      // Build field lists and placeholders
      const fields = config.fields.filter(field => record[field] !== undefined);
      const values = fields.map(field => record[field]);
      const placeholders = fields.map((_, i) => `$${i + 1}`);
      
      // Build UPSERT query
      const conflictFields = [config.idField];
      const updateSet = fields
        .filter(f => f !== config.idField)
        .map(f => `${f} = EXCLUDED.${f}`)
        .join(', ');

      const query = `
        INSERT INTO ${config.table} (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT (${conflictFields.join(', ')})
        DO ${updateSet ? `UPDATE SET ${updateSet}` : 'NOTHING'}
        RETURNING (xmax = 0) as inserted
      `;

      if (DRY_RUN) {
        console.log(`  [DRY-RUN] Would execute: ${query}`);
        console.log(`  [DRY-RUN] With values: ${JSON.stringify(values)}`);
        continue;
      }

      const result = await client.query(query, values);
      
      if (result.rows[0]?.inserted) {
        inserted++;
        console.log(`  ✅ Inserted: ${record[config.idField] || record.name || record.sku}`);
      } else {
        updated++;
        console.log(`  ♻️  Updated: ${record[config.idField] || record.name || record.sku}`);
      }
    } catch (error) {
      skipped++;
      console.error(`  ❌ Error seeding record: ${error.message}`);
      console.error(`     Record: ${JSON.stringify(record).substring(0, 100)}`);
    }
  }

  return { inserted, updated, skipped };
}

async function recordSeederRun(client, seederName, stats) {
  if (DRY_RUN) return;

  const query = `
    INSERT INTO seeder_runs (seeder_name, records_inserted, records_updated, records_skipped, status, completed_at)
    VALUES ($1, $2, $3, $4, $5, now())
  `;
  
  try {
    await client.query(query, [
      seederName,
      stats.inserted,
      stats.updated,
      stats.skipped,
      'completed'
    ]);
  } catch (error) {
    console.warn(`⚠️  Could not record seeder run: ${error.message}`);
  }
}

async function seedFile(client, filePath) {
  const fileName = path.basename(filePath);
  const tableName = fileName.replace('_seed.json', '');
  
  if (!TABLE_CONFIGS[tableName]) {
    console.warn(`⚠️  No configuration found for ${tableName}, skipping...`);
    return { inserted: 0, updated: 0, skipped: 0 };
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const stats = await seedTable(client, tableName, data, TABLE_CONFIGS[tableName]);
  await recordSeederRun(client, fileName, stats);
  
  return stats;
}

async function main() {
  console.log('🌱 Schema Contracts Seeder');
  console.log('==========================\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    let totalStats = { inserted: 0, updated: 0, skipped: 0 };

    if (SEED_ALL) {
      const seedersDir = path.join(__dirname, '..', 'seeders');
      
      for (const fileName of SEED_ORDER) {
        const filePath = path.join(seedersDir, fileName);
        if (fs.existsSync(filePath)) {
          const stats = await seedFile(client, filePath);
          totalStats.inserted += stats.inserted;
          totalStats.updated += stats.updated;
          totalStats.skipped += stats.skipped;
        } else {
          console.warn(`⚠️  File not found: ${fileName}`);
        }
      }
    } else {
      const stats = await seedFile(client, FIXTURES_PATH);
      totalStats = stats;
    }

    console.log('\n📊 Summary');
    console.log('==========');
    console.log(`✅ Inserted: ${totalStats.inserted}`);
    console.log(`♻️  Updated:  ${totalStats.updated}`);
    console.log(`⏭️  Skipped:  ${totalStats.skipped}`);
    console.log(`\n${DRY_RUN ? '🔍 DRY RUN COMPLETE' : '✨ Seeding complete!'}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
