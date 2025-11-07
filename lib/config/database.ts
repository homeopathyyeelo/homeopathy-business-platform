/**
 * Unified Database Configuration
 * Single source of truth for all database connections
 */

export const DATABASE_CONFIG = {
  // PostgreSQL - Primary Database
  postgres: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5433/yeelo_homeopathy',
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'yeelo_homeopathy',
  },

  // Redis - Cache & Sessions
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || 'redis_password',
  },

  // Connection Pool Settings
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

// Helper to get connection string
export function getPostgresConnectionString(): string {
  return DATABASE_CONFIG.postgres.url;
}

// Helper to get connection config
export function getPostgresConfig() {
  return {
    host: DATABASE_CONFIG.postgres.host,
    port: DATABASE_CONFIG.postgres.port,
    user: DATABASE_CONFIG.postgres.user,
    password: DATABASE_CONFIG.postgres.password,
    database: DATABASE_CONFIG.postgres.database,
  };
}
