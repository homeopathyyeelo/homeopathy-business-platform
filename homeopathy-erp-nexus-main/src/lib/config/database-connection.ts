// Database Connection Configuration
// Supports both Supabase and PostgreSQL connections

import { supabase } from "@/integrations/supabase/client";

export interface DatabaseConfig {
  type: 'supabase' | 'postgresql';
  supabase?: {
    url: string;
    anonKey: string;
  };
  postgresql?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
  };
}

// Default configuration - PostgreSQL for production, Supabase for development
// const isProduction = process.env.NODE_ENV === 'production';
const isProduction = ['production'].includes(process.env.NODE_ENV);
const defaultConfig: DatabaseConfig = {
  type: isProduction ? 'postgresql' : 'supabase',
  supabase: {
    url: "https://cjujwogpqahgsonwcxdf.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWp3b2dwcWFoZ3NvbndjeGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTU5MTYsImV4cCI6MjA1OTU3MTkxNn0.g2I-HSC-PKJ5eGzlqqX5hXkbVGgWxu9x2X5t7tI-bac"
  },
  postgresql: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DATABASE || 'yeelo_homeopathy',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  }
};

// Get database configuration from app settings
export async function getDatabaseConfig(): Promise<DatabaseConfig> {
  try {
    // Try to get configuration from app_configuration table
    const { data, error } = await supabase
      .from('app_configuration')
      .select('key, value')
      .in('key', [
        'database_source',
        'postgresql_host',
        'postgresql_port', 
        'postgresql_database',
        'postgresql_user',
        'postgresql_password',
        'postgresql_ssl'
      ]);

    if (error || !data) {
      console.log('Using default configuration:', defaultConfig.type);
      return defaultConfig;
    }

    const config: Record<string, string> = {};
    data.forEach(item => {
      config[item.key] = item.value || '';
    });

    const dbType = config.database_source as 'supabase' | 'postgresql' || 'supabase';

    if (dbType === 'postgresql') {
      return {
        type: 'postgresql',
        postgresql: {
          host: config.postgresql_host || 'localhost',
          port: parseInt(config.postgresql_port) || 5432,
          database: config.postgresql_database || 'yeelo_homeopathy',
          user: config.postgresql_user || 'postgres',
          password: config.postgresql_password || '',
          ssl: config.postgresql_ssl === 'true'
        }
      };
    }

    return defaultConfig;
  } catch (error) {
    console.error('Error loading database configuration:', error);
    return defaultConfig;
  }
}

// PostgreSQL Client (for Node.js environment)
let pgClient: any = null;

export async function getPostgreSQLClient() {
  if (typeof window !== 'undefined') {
    throw new Error('PostgreSQL client is not available in browser environment');
  }

  if (pgClient) {
    return pgClient;
  }

  try {
    // const { Pool } = require('pg');
    const { Pool } = await import("pg"); 
    const config = await getDatabaseConfig();
    
    if (config.type !== 'postgresql' || !config.postgresql) {
      throw new Error('PostgreSQL configuration not found');
    }

    pgClient = new Pool({
      host: config.postgresql.host,
      port: config.postgresql.port,
      database: config.postgresql.database,
      user: config.postgresql.user,
      password: config.postgresql.password,
      ssl: config.postgresql.ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    await pgClient.query('SELECT NOW()');
    console.log('PostgreSQL connection established');
    
    return pgClient;
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

// Universal Database Client
export class UniversalDatabaseClient {
  private config: DatabaseConfig;
  private pgClient: any = null;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (this.config.type === 'supabase') {
      return this.executeSupabaseQuery(sql, params);
    } else {
      return this.executePostgreSQLQuery(sql, params);
    }
  }

  private async executeSupabaseQuery(sql: string, params: any[]): Promise<any> {
    // For Supabase, we use the existing methods
    // This is a simplified implementation - in practice, you'd need to 
    // convert SQL to Supabase API calls
    throw new Error('Direct SQL execution not supported with Supabase client. Use Supabase API methods.');
  }

  private async executePostgreSQLQuery(sql: string, params: any[]): Promise<any> {
    if (!this.pgClient) {
      this.pgClient = await getPostgreSQLClient();
    }
    
    const result = await this.pgClient.query(sql, params);
    return result.rows;
  }

  async disconnect(): Promise<void> {
    if (this.pgClient) {
      await this.pgClient.end();
      this.pgClient = null;
    }
  }
}

// Create universal client instance
export async function createDatabaseClient(): Promise<UniversalDatabaseClient> {
  const config = await getDatabaseConfig();
  return new UniversalDatabaseClient(config);
}

// Database switching utilities
export async function switchToPostgreSQL(connectionParams: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}): Promise<boolean> {
  try {
    // Update app configuration
    const updates = [
      { key: 'database_source', value: 'postgresql' },
      { key: 'postgresql_host', value: connectionParams.host },
      { key: 'postgresql_port', value: connectionParams.port.toString() },
      { key: 'postgresql_database', value: connectionParams.database },
      { key: 'postgresql_user', value: connectionParams.user },
      { key: 'postgresql_password', value: connectionParams.password },
      { key: 'postgresql_ssl', value: connectionParams.ssl ? 'true' : 'false' }
    ];

    for (const update of updates) {
      await supabase
        .from('app_configuration')
        .upsert(update, { onConflict: 'key' });
    }

    // Test PostgreSQL connection
    const testConfig: DatabaseConfig = {
      type: 'postgresql',
      postgresql: connectionParams
    };
    
    const client = new UniversalDatabaseClient(testConfig);
    await client.query('SELECT 1');
    await client.disconnect();

    console.log('Successfully switched to PostgreSQL');
    return true;
  } catch (error) {
    console.error('Failed to switch to PostgreSQL:', error);
    return false;
  }
}

export async function switchToSupabase(): Promise<boolean> {
  try {
    await supabase
      .from('app_configuration')
      .upsert({ key: 'database_source', value: 'supabase' }, { onConflict: 'key' });

    console.log('Successfully switched to Supabase');
    return true;
  } catch (error) {
    console.error('Failed to switch to Supabase:', error);
    return false;
  }
}