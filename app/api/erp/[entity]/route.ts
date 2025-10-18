/**
 * Generic ERP Entity API endpoints
 * Handles CRUD operations for all master data entities
 * GET /api/erp/[entity] - List entities with filtering and pagination
 * POST /api/erp/[entity] - Create a new entity
 * PUT /api/erp/[entity] - Update an entity
 * DELETE /api/erp/[entity] - Delete an entity
 */

import type { NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Map of entity names to Prisma model names
const entityModelMap: Record<string, any> = {
  customers: prisma.customer,
  products: prisma.product,
  suppliers: prisma.supplier,
  vendors: prisma.vendor,
  // Add more mappings as needed
}

export async function GET(
  request: NextRequest,
  { params }: { params: { entity: string } }
) {
  try {
    const entity = params.entity
    const model = entityModelMap[entity]

    if (!model) {
      return Response.json({
        success: false,
        error: `Entity '${entity}' not found`
      }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit
    const search = searchParams.get("search") || ""

    // Build where clause for search
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {}

    // Get entities with pagination
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: {
          created_at: 'desc'
        }
      }),
      model.count({ where })
    ])

    return Response.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error(`Get ${params.entity} error:`, error)
    return Response.json({
      success: false,
      error: `Failed to get ${params.entity}`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { entity: string } }
) {
  try {
    const entity = params.entity
    const model = entityModelMap[entity]

    if (!model) {
      return Response.json({
        success: false,
        error: `Entity '${entity}' not found`
      }, { status: 404 })
    }

    const body = await request.json()

    // Generate unique code if not provided
    if (!body.code) {
      body.code = `${entity.toUpperCase()}-${Date.now()}`
    }

    // Create entity
    const data = await model.create({
      data: body
    })

    return Response.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error) {
    console.error(`Create ${params.entity} error:`, error)
    return Response.json({
      success: false,
      error: `Failed to create ${params.entity}`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { entity: string } }
) {
  try {
    const entity = params.entity
    const model = entityModelMap[entity]

    if (!model) {
      return Response.json({
        success: false,
        error: `Entity '${entity}' not found`
      }, { status: 404 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return Response.json({
        success: false,
        error: "ID is required"
      }, { status: 400 })
    }

    const data = await model.update({
      where: { id },
      data: updateData
    })

    return Response.json({
      success: true,
      data
    })
  } catch (error) {
    console.error(`Update ${params.entity} error:`, error)
    return Response.json({
      success: false,
      error: `Failed to update ${params.entity}`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { entity: string } }
) {
  try {
    const entity = params.entity
    const model = entityModelMap[entity]

    if (!model) {
      return Response.json({
        success: false,
        error: `Entity '${entity}' not found`
      }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({
        success: false,
        error: "ID is required"
      }, { status: 400 })
    }

    await model.delete({
      where: { id }
    })

    return Response.json({
      success: true,
      message: `${entity} deleted successfully`
    })
  } catch (error) {
    console.error(`Delete ${params.entity} error:`, error)
    return Response.json({
      success: false,
      error: `Failed to delete ${params.entity}`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
