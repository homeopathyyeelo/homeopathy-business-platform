// Production Database Configuration
// This file handles PostgreSQL connection for production environments

import { getDatabaseConfig, createDatabaseClient } from './database-connection';

export interface ProductionDBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

// Enhanced production database utilities
export class ProductionDatabase {
  private client: any = null;
  private config: ProductionDBConfig | null = null;

  async initialize(): Promise<boolean> {
    try {
      const dbConfig = await getDatabaseConfig();
      
      if (dbConfig.type !== 'postgresql' || !dbConfig.postgresql) {
        throw new Error('PostgreSQL configuration not found');
      }

      this.config = {
        ...dbConfig.postgresql,
        ssl: dbConfig.postgresql.ssl || false
      };
      this.client = await createDatabaseClient();
      
      console.log('✅ Production PostgreSQL database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize production database:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        await this.initialize();
      }
      
      await this.client.query('SELECT 1');
      console.log('✅ PostgreSQL connection test successful');
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL connection test failed:', error);
      return false;
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    try {
      if (!this.client) {
        await this.initialize();
      }
      
      return await this.client.query(sql, params);
    } catch (error) {
      console.error('❌ Database query failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.config = null;
    }
  }

  getConfig(): ProductionDBConfig | null {
    return this.config;
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

// Singleton instance for production database
export const productionDB = new ProductionDatabase();

// Environment detection utilities
export const isProductionEnvironment = (): boolean => {
  return ['production'].includes(process.env.NODE_ENV || '');
};

export const shouldUsePostgreSQL = async (): Promise<boolean> => {
  try {
    const config = await getDatabaseConfig();
    return config.type === 'postgresql';
  } catch {
    return isProductionEnvironment();
  }
};

// Database switching utilities for production
export const switchToProductionMode = async (): Promise<boolean> => {
  try {
    console.log('🔄 Switching to production database mode...');
    
    const success = await productionDB.initialize();
    if (success) {
      console.log('✅ Successfully switched to production PostgreSQL database');
      return true;
    }
    
    throw new Error('Failed to initialize production database');
  } catch (error) {
    console.error('❌ Failed to switch to production mode:', error);
    return false;
  }
};

// Health check for production database
export const checkProductionHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  details?: any;
}> => {
  try {
    const isHealthy = await productionDB.testConnection();
    
    if (isHealthy) {
      return {
        status: 'healthy',
        message: 'PostgreSQL database is running and accessible',
        details: {
          config: productionDB.getConfig(),
          connected: productionDB.isConnected()
        }
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'PostgreSQL database connection failed'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database health check failed',
      details: error
    };
  }
};