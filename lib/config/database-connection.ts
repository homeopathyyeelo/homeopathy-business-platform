/**
 * Database connection configuration
 * Client-safe utilities for database configuration
 */

export interface DatabaseConfig {
  type: 'postgresql' | 'supabase';
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

// Get current database configuration
export const getDatabaseConfig = async (): Promise<DatabaseConfig> => {
  try {
    const response = await fetch('/api/settings/database-config');
    if (!response.ok) throw new Error('Failed to fetch database config');
    return response.json();
  } catch (error) {
    // Default to PostgreSQL
    return {
      type: 'postgresql',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5433'),
      database: process.env.POSTGRES_DATABASE || 'yeelo_homeopathy',
      user: process.env.POSTGRES_USER || 'postgres',
    };
  }
};

// Switch to PostgreSQL
export const switchToPostgreSQL = async (config: Partial<DatabaseConfig>): Promise<void> => {
  const response = await fetch('/api/settings/database-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'postgresql',
      ...config,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to switch to PostgreSQL');
  }
};

// Switch to Supabase
export const switchToSupabase = async (config: Partial<DatabaseConfig>): Promise<void> => {
  const response = await fetch('/api/settings/database-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'supabase',
      ...config,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to switch to Supabase');
  }
};

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/settings/test-connection');
    return response.ok;
  } catch (error) {
    return false;
  }
};
