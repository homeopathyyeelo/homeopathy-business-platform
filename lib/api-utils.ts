/**
 * API utility functions for Yeelo Homeopathy Platform
 * Common functions for API request/response handling, validation, and error management
 */

import { type NextRequest, NextResponse } from "next/server"
import type { ApiResponse, PaginationParams } from "./types"
import { verifyToken } from "./auth"
import { query } from "./database"

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(data?: T, message?: string, success = true, status = 200): NextResponse {
  const response: ApiResponse<T> = {
    success,
    ...(data && { data }),
    ...(message && { message }),
  }

  return NextResponse.json(response, { status })
}

/**
 * Create an error response
 */
export function createErrorResponse(error: string, status = 400, details?: any): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
    ...(details && { details }),
  }

  return NextResponse.json(response, { status })
}

/**
 * Extract pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url)

  return {
    page: Math.max(1, Number.parseInt(searchParams.get("page") || "1")),
    limit: Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "20"))),
    sort: searchParams.get("sort") || "created_at",
    order: (searchParams.get("order") as "asc" | "desc") || "desc",
  }
}

/**
 * Extract user information from request headers (set by middleware)
 */
export function getUserFromRequest(request: NextRequest): {
  id: number
  uuid: string
  role: string
} | null {
  const userId = request.headers.get("x-user-id")
  const userUuid = request.headers.get("x-user-uuid")
  const userRole = request.headers.get("x-user-role")

  if (!userId || !userUuid || !userRole) {
    return null
  }

  return {
    id: Number.parseInt(userId),
    uuid: userUuid,
    role: userRole,
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(body: any, requiredFields: string[]): string[] {
  const missingFields: string[] = []

  for (const field of requiredFields) {
    if (!body[field] && body[field] !== 0 && body[field] !== false) {
      missingFields.push(field)
    }
  }

  return missingFields
}

/**
 * Sanitize string input (trim and basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Basic XSS prevention
    .substring(0, 1000) // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate Indian phone number
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, "")
  return /^[6-9]\d{9}$/.test(cleanPhone.slice(-10))
}

/**
 * Generate SQL WHERE clause from filters
 */
export function buildWhereClause(
  filters: Record<string, any>,
  allowedFields: string[],
): { whereClause: string; values: any[] } {
  const conditions: string[] = []
  const values: any[] = []
  let paramCount = 1

  for (const [key, value] of Object.entries(filters)) {
    if (!allowedFields.includes(key) || value === undefined || value === null) {
      continue
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        const placeholders = value.map(() => `$${paramCount++}`).join(", ")
        conditions.push(`${key} = ANY(ARRAY[${placeholders}])`)
        values.push(...value)
      }
    } else if (typeof value === "string" && key.includes("search")) {
      conditions.push(`${key.replace("_search", "")} ILIKE $${paramCount++}`)
      values.push(`%${value}%`)
    } else {
      conditions.push(`${key} = $${paramCount++}`)
      values.push(value)
    }
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  }
}

/**
 * Handle async API route with error catching
 */
export function withErrorHandling(handler: (request: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error("API Error:", error)

      return createErrorResponse(error instanceof Error ? error.message : "Internal server error", 500)
    }
  }
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowStart = now - windowMs

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }

  const current = rateLimitMap.get(identifier)

  if (!current || current.resetTime < now) {
    // First request or window expired
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    }
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  current.count++

  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  }
}

export interface AuthenticatedUser {
  id: number
  uuid: string
  email: string
  name: string
  role: "admin" | "staff" | "marketer" | "customer"
}

/**
 * Authenticate request using JWT token (edge-compatible)
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)

    // Use the edge-compatible JWT verification
    const decoded = await verifyToken(token)

    // Get user details from database - fix PostgreSQL syntax
    const result = await query(
      "SELECT id, uuid, email, full_name as name, role FROM users WHERE id = $1 AND is_active = true",
      [decoded.id],
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as AuthenticatedUser
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

/**
 * Require specific role for API access
 */
export function requireRole(allowedRoles: string[]) {
  return (user: AuthenticatedUser | null): boolean => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }
}

/**
 * Generate JWT token for user (edge-compatible)
 */
export async function generateToken(userId: number, expiresIn = "24h"): Promise<string> {
  // Get user details for token generation
  const result = await query("SELECT id, uuid, phone, role FROM users WHERE id = $1 AND is_active = true", [userId])

  if (result.rows.length === 0) {
    throw new Error("User not found")
  }

  const user = result.rows[0]

  // Use the edge-compatible token generation from auth.ts
  const { generateToken: authGenerateToken } = await import("./auth")
  return authGenerateToken(user)
}
