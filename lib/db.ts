/**
 * Database Connection Utility
 * Direct PostgreSQL connection for Next.js API routes
 */

import { Pool } from 'pg';

// Get database URL from environment or use default
// For Docker: postgres:5432, For local: localhost:5432
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    // Replace 'postgres' hostname with 'localhost' when running outside Docker
    return process.env.DATABASE_URL.replace('@postgres:', '@localhost:');
  }
  return 'postgresql://postgres:postgres@localhost:5432/yeelo_homeopathy';
};

// Create a connection pool
const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log(' Database connected successfully');
});

pool.on('error', (err) => {
  console.error(' Unexpected database error:', err);
});

/**
 * Query the database
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * Close the pool (for graceful shutdown)
 */
export async function closePool() {
  await pool.end();
}

export default pool;
