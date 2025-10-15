/**
 * Customers API endpoints
 * GET /api/customers - List customers with filtering and pagination
 * POST /api/customers - Create a new customer
 */

import type { NextRequest } from "next/server"
import { query } from "@/lib/database"
import { getUserFromRequest, createErrorResponse } from "@/lib/auth"
import { UserRole } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Bypass auth for development/testing
    const user = getUserFromRequest(request)
    // if (!user || !["ADMIN", "MANAGER", "STAFF", "MARKETER"].includes(user.role)) {
    //   return createErrorResponse("Insufficient permissions", 403)
    // }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Get customers with pagination
    const result = await query(`
      SELECT 
        c.*,
        COUNT(*) OVER() as total_count
      FROM customers c
      ORDER BY c."createdAt" DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset])

    const customers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      dateOfBirth: row.dateOfBirth,
      gender: row.gender,
      marketingConsent: row.marketingConsent,
      loyaltyPoints: row.loyaltyPoints,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0

    return Response.json({
      success: true,
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get customers error:", error)
    return createErrorResponse("Failed to get customers", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["ADMIN", "MANAGER", "STAFF"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.phone) {
      return createErrorResponse("Name and phone are required", 400)
    }

    // Create customer
    const result = await query(`
      INSERT INTO customers (name, phone, email, address, date_of_birth, gender, marketing_consent, loyalty_points)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      body.name.trim(),
      body.phone,
      body.email?.trim() || null,
      body.address || null,
      body.dateOfBirth || null,
      body.gender || null,
      Boolean(body.marketingConsent),
      parseInt(body.loyaltyPoints) || 0
    ])

    const customer = result.rows[0]

    return Response.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        dateOfBirth: customer.date_of_birth,
        gender: customer.gender,
        marketingConsent: customer.marketing_consent,
        loyaltyPoints: customer.loyalty_points,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Create customer error:", error)
    return createErrorResponse("Failed to create customer", 400)
  }
}
