/**
 * ERP Customers API endpoints
 * GET /api/erp/customers - List customers with filtering and pagination
 * POST /api/erp/customers - Create a new customer
 */

import type { NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getUserFromRequest, createErrorResponse } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        take: limit,
        skip: skip,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.customer.count()
    ])

    return Response.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get customers error:", error)
    return Response.json({
      success: false,
      error: "Failed to get customers",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.phone) {
      return Response.json({
        success: false,
        error: "Name and phone are required"
      }, { status: 400 })
    }

    // Generate unique code
    const code = `CUST-${Date.now()}`
    
    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: body.name.trim(),
        code: code,
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        address: body.address || 'N/A',
        city: body.city || 'N/A',
        state: body.state || 'N/A',
        pincode: body.pincode || '000000',
        gst_number: body.gstNumber || null,
        loyalty_points: parseInt(body.loyaltyPoints) || 0,
        is_active: true
      }
    })

    return Response.json({
      success: true,
      data: customer
    }, { status: 201 })
  } catch (error) {
    console.error("Create customer error:", error)
    return Response.json({
      success: false,
      error: "Failed to create customer",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return Response.json({
        success: false,
        error: "Customer ID is required"
      }, { status: 400 })
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(updateData.name && { name: updateData.name.trim() }),
        ...(updateData.phone && { phone: updateData.phone.trim() }),
        ...(updateData.email !== undefined && { email: updateData.email?.trim() || null }),
        ...(updateData.address !== undefined && { address: updateData.address || 'N/A' }),
        ...(updateData.city !== undefined && { city: updateData.city || 'N/A' }),
        ...(updateData.state !== undefined && { state: updateData.state || 'N/A' }),
        ...(updateData.pincode !== undefined && { pincode: updateData.pincode || '000000' }),
        ...(updateData.gstNumber !== undefined && { gst_number: updateData.gstNumber || null }),
        ...(updateData.loyaltyPoints !== undefined && { loyalty_points: parseInt(updateData.loyaltyPoints) || 0 }),
        ...(updateData.is_active !== undefined && { is_active: Boolean(updateData.is_active) }),
      }
    })

    return Response.json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error("Update customer error:", error)
    return Response.json({
      success: false,
      error: "Failed to update customer",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({
        success: false,
        error: "Customer ID is required"
      }, { status: 400 })
    }

    await prisma.customer.delete({
      where: { id }
    })

    return Response.json({
      success: true,
      message: "Customer deleted successfully"
    })
  } catch (error) {
    console.error("Delete customer error:", error)
    return Response.json({
      success: false,
      error: "Failed to delete customer",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
