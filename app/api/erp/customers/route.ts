/**
 * ERP Customers API endpoints
 * GET /api/erp/customers - List customers with pagination
 * POST /api/erp/customers - Create a new customer
 */

import type { NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count(),
    ])

    return Response.json({
      success: true,
      data: customers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error("Get customers error:", error)
    return Response.json(
      { success: false, error: "Failed to get customers", details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = (body.name || "").trim()
    const phone = (body.phone || "").trim()

    if (!name || !phone) {
      return Response.json({ success: false, error: "Name and phone are required" }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        code: `CUST-${Date.now()}`,
        phone,
        email: body.email?.trim() || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        pincode: body.pincode || null,
        gst_number: body.gst_number || null,
        is_active: true,
      },
    })

    return Response.json({ success: true, data: customer }, { status: 201 })
  } catch (error: any) {
    console.error("Create customer error:", error)
    return Response.json(
      { success: false, error: "Failed to create customer", details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
