/**
 * Database connection and query utilities for Yeelo Homeopathy Platform
 * Provides type-safe database operations and connection management
 */

import { Pool, type PoolClient, type QueryResult } from "pg"

// Database configuration interface
interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean
  max?: number // Maximum number of clients in the pool
  idleTimeoutMillis?: number
  connectionTimeoutMillis?: number
}

// Database connection pool
let pool: Pool | null = null

/**
 * Initialize database connection pool
 * Uses environment variables for configuration
 */
export function initializeDatabase(): Pool {
  if (pool) {
    return pool
  }

  const config: DatabaseConfig = {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "yeelo_homeopathy",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    ssl: process.env.NODE_ENV === "production",
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  }

  pool = new Pool(config)

  // Handle pool errors
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err)
    process.exit(-1)
  })

  return pool
}

/**
 * Get database connection pool
 * Initializes pool if not already created
 */
export function getDatabase(): Pool {
  if (!pool) {
    return initializeDatabase()
  }
  return pool
}

/**
 * Execute a query with parameters
 * Provides type safety and error handling
 */
export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const db = getDatabase()
  const start = Date.now()

  try {
    const result = await db.query<T>(text, params)
    const duration = Date.now() - start

    // Log slow queries (> 100ms)
    if (duration > 100) {
      console.warn(`Slow query detected (${duration}ms):`, text)
    }

    return result
  } catch (error) {
    console.error("Database query error:", error)
    console.error("Query:", text)
    console.error("Params:", params)
    throw error
  }
}

/**
 * Execute a transaction with multiple queries
 * Automatically handles rollback on error
 */
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const db = getDatabase()
  const client = await db.connect()

  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

/**
 * Close database connection pool
 * Should be called when shutting down the application
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// Database utility functions for common operations

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)
  return `YEL-${year}-${timestamp}`
}

/**
 * Generate a unique coupon code
 */
export function generateCouponCode(prefix = "YEELO"): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${randomSuffix}`
}

/**
 * Generate a unique referral code
 */
export function generateReferralCode(customerName: string): string {
  const namePrefix = customerName.substring(0, 3).toUpperCase()
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${namePrefix}${randomSuffix}`
}

/**
 * Validate phone number format (Indian mobile numbers)
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\D/g, "").slice(-10))
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`
  }
  return phone
}

/**
 * Calculate distance between two coordinates (in kilometers)
 * Uses Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Log an event to the events table
 */
export async function logEvent(
  eventType: string,
  payload?: any,
  entityType?: string,
  entityId?: number,
  userId?: number,
): Promise<void> {
  try {
    await query(
      `INSERT INTO events (event_type, entity_type, entity_id, payload, user_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [eventType, entityType, entityId, JSON.stringify(payload), userId],
    )
  } catch (error) {
    console.error("Failed to log event:", error)
    // Don't throw error to avoid breaking main functionality
  }
}

export const db = {
  execute: async (queryText: string, params?: any[]) => {
    const result = await query(queryText, params)
    return [result.rows, result]
  },
  query: query,
  transaction: transaction,
}
