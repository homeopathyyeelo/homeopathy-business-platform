#!/usr/bin/env node

/**
 * Product Seeding Script
 * Seeds the database with initial product data
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy',
});

// Load product data
const productsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/seed-products.json'), 'utf8')
);

async function seedProducts() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting product seeding...\n');
    
    await client.query('BEGIN');
    
    let totalInserted = 0;
    
    for (const categoryData of productsData.products) {
      console.log(`📦 Seeding category: ${categoryData.category}`);
      
      for (const item of categoryData.items) {
        const query = `
          INSERT INTO products (
            id, name, sku, category, type, stock, unit, 
            price, description, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, 
            $7, $8, NOW(), NOW()
          )
          ON CONFLICT (sku) DO UPDATE SET
            stock = products.stock + EXCLUDED.stock,
            updated_at = NOW()
        `;
        
        const values = [
          item.name,
          item.sku,
          categoryData.category,
          item.type,
          item.count,
          item.unit,
          calculatePrice(item), // Auto-calculate price based on type
          generateDescription(item, categoryData.category),
        ];
        
        await client.query(query, values);
        totalInserted++;
        console.log(`  ✓ ${item.name} (${item.quantity})`);
      }
      
      console.log('');
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Product seeding completed!');
    console.log(`📊 Total products inserted/updated: ${totalInserted}`);
    console.log('');
    
    // Display summary
    const summary = await client.query(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(stock) as total_stock
      FROM products
      GROUP BY category
      ORDER BY category
    `);
    
    console.log('📈 Database Summary:');
    console.log('─'.repeat(50));
    summary.rows.forEach(row => {
      console.log(`${row.category.padEnd(20)} | ${row.count} products | ${row.total_stock} units`);
    });
    console.log('─'.repeat(50));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding products:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Helper function to calculate price based on product type
function calculatePrice(item) {
  const basePrice = {
    'medicine': 150,
    'drops': 120,
    'syrup': 200,
    'tonic': 250,
    'spray': 180,
    'gel': 160,
  };
  
  const price = basePrice[item.type] || 150;
  
  // Adjust price based on size if available
  if (item.size) {
    const ml = parseInt(item.size);
    if (ml >= 180) return price * 1.5;
    if (ml >= 100) return price * 1.2;
  }
  
  return price;
}

// Helper function to generate description
function generateDescription(item, category) {
  const descriptions = {
    'Props': `${item.name} is a homeopathic medicine from the Props category. Available in ${item.unit}.`,
    'Syrup & Tonics': `${item.name} is a ${item.type} ${item.size ? `(${item.size})` : ''} for homeopathic treatment.`,
  };
  
  return descriptions[category] || `${item.name} - Homeopathic ${item.type}`;
}

// Run the seeding
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('\n✨ Seeding process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProducts };
