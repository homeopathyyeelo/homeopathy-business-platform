// PostgreSQL Database Client for Next.js API Routes
// Replaces Supabase with direct PostgreSQL connection

import { Pool, QueryResult } from 'pg';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  database: process.env.POSTGRES_DATABASE || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Generic query function
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// Database helper functions
export const db = {
  // Get all records from a table
  async getAll(tableName: string, conditions?: Record<string, any>) {
    let sql = `SELECT * FROM ${tableName}`;
    const params: any[] = [];
    
    if (conditions) {
      const whereClauses: string[] = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(conditions)) {
        whereClauses.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
      
      if (whereClauses.length > 0) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
      }
    }
    
    // Try different timestamp column names
    try {
      sql += ' ORDER BY "createdAt" DESC';
      const result = await query(sql, params);
      return result.rows;
    } catch (error: any) {
      if (error.message?.includes('createdAt')) {
        // Fallback to created_at or id
        sql = sql.replace('ORDER BY "createdAt" DESC', 'ORDER BY created_at DESC');
        try {
          const result = await query(sql, params);
          return result.rows;
        } catch {
          // Final fallback - no ordering
          sql = sql.replace(/ORDER BY .*$/, '');
          const result = await query(sql, params);
          return result.rows;
        }
      }
      throw error;
    }
  },

  // Get one record by ID
  async getById(tableName: string, id: string) {
    const result = await query(
      `SELECT * FROM ${tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  // Insert a new record
  async insert(tableName: string, data: Record<string, any>) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `
      INSERT INTO ${tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0];
  },

  // Update a record
  async update(tableName: string, id: string, data: Record<string, any>) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    const sql = `
      UPDATE ${tableName}
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;
    
    const result = await query(sql, [...values, id]);
    return result.rows[0];
  },

  // Delete a record
  async delete(tableName: string, id: string) {
    const result = await query(
      `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  // Custom query with parameters
  async customQuery(sql: string, params?: any[]) {
    const result = await query(sql, params);
    return result.rows;
  },

  // Get low stock items
  async getLowStockItems(threshold: number = 10) {
    const sql = `
      SELECT 
        i.*,
        p.name as product_name,
        p.product_code,
        p.min_stock_level,
        b.name as brand_name,
        w.name as warehouse_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.quantity <= $1
      ORDER BY i.quantity ASC
    `;
    const result = await query(sql, [threshold]);
    return result.rows;
  },

  // Get expiring items
  async getExpiringItems(days: number = 30) {
    const sql = `
      SELECT 
        i.*,
        p.name as product_name,
        p.product_code,
        b.name as brand_name,
        w.name as warehouse_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.expiry_date <= CURRENT_DATE + INTERVAL '${days} days'
        AND i.expiry_date > CURRENT_DATE
      ORDER BY i.expiry_date ASC
    `;
    const result = await query(sql);
    return result.rows;
  },

  // Get invoices with customer details
  async getInvoicesWithCustomers() {
    const sql = `
      SELECT 
        i.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.customer_id as customer_code
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `;
    const result = await query(sql);
    return result.rows;
  },

  // Get all invoices
  async getAllInvoices() {
    try {
      const sql = `SELECT * FROM invoices ORDER BY created_at DESC LIMIT 100`;
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      // Fallback to simple query
      const sql = `SELECT * FROM invoices LIMIT 100`;
      const result = await query(sql);
      return result.rows;
    }
  },

  // Get purchases with supplier details
  async getPurchasesWithSuppliers() {
    const sql = `
      SELECT 
        p.*,
        s.company_name as supplier_name,
        s.phone as supplier_phone,
        s.supplier_id as supplier_code
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
    `;
    const result = await query(sql);
    return result.rows;
  },

  // Get all purchase orders
  async getAllPurchaseOrders() {
    try {
      const sql = `SELECT * FROM purchases ORDER BY created_at DESC LIMIT 100`;
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      const sql = `SELECT * FROM purchases LIMIT 100`;
      const result = await query(sql);
      return result.rows;
    }
  },

  // Get product with all details
  async getProductDetails(productId: string) {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name,
        pu.name as purchase_unit_name,
        su.name as sale_unit_name,
        t.name as tax_name,
        t.rate as tax_rate
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN units pu ON p.purchase_unit_id = pu.id
      LEFT JOIN units su ON p.sale_unit_id = su.id
      LEFT JOIN tax_rates t ON p.tax_rate_id = t.id
      WHERE p.id = $1
    `;
    const result = await query(sql, [productId]);
    return result.rows[0];
  },

  // Get customer balance
  async getCustomerBalance(customerId: string) {
    const sql = `
      SELECT 
        c.opening_balance,
        COALESCE(SUM(i.balance_due), 0) as total_due
      FROM customers c
      LEFT JOIN invoices i ON c.id = i.customer_id AND i.payment_status != 'paid'
      WHERE c.id = $1
      GROUP BY c.id, c.opening_balance
    `;
    const result = await query(sql, [customerId]);
    return result.rows[0];
  },

  // Dashboard statistics
  async getDashboardStats() {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM products WHERE "isActive" = true) as total_products,
        (SELECT COUNT(*) FROM customers WHERE "isActive" = true) as total_customers,
        (SELECT COUNT(*) FROM suppliers WHERE "isActive" = true) as total_suppliers,
        (SELECT SUM(total) FROM invoices WHERE EXTRACT(MONTH FROM invoice_date) = EXTRACT(MONTH FROM CURRENT_DATE)) as monthly_revenue,
        (SELECT COUNT(*) FROM inventory WHERE quantity <= 10) as low_stock_count,
        (SELECT COUNT(*) FROM inventory WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days') as expiring_soon_count
    `;
    const result = await query(sql);
    return result.rows[0];
  },

  // Batch operations
  async batchInsert(tableName: string, records: Record<string, any>[]) {
    if (records.length === 0) return [];
    
    const keys = Object.keys(records[0]);
    const values = records.map(record => Object.values(record));
    
    const placeholders = records.map((_, recordIndex) => {
      const recordPlaceholders = keys.map((_, keyIndex) => {
        return `$${recordIndex * keys.length + keyIndex + 1}`;
      }).join(', ');
      return `(${recordPlaceholders})`;
    }).join(', ');
    
    const sql = `
      INSERT INTO ${tableName} (${keys.join(', ')})
      VALUES ${placeholders}
      RETURNING *
    `;
    
    const flatValues = values.flat();
    const result = await query(sql, flatValues);
    return result.rows;
  },

  // Transaction support
  async transaction(callback: (client: any) => Promise<any>) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

export default db;
