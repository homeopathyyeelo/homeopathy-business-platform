/**
 * Individual product API endpoints
 * GET /api/products/[id] - Get product by ID
 * PUT /api/products/[id] - Update product
 * DELETE /api/products/[id] - Delete product
 */

import type { NextRequest } from "next/server"
import { getProductById, updateProduct, deleteProduct } from "@/lib/products"
import { createApiResponse, createErrorResponse, getUserFromRequest } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = Number.parseInt(params.id)
    if (isNaN(productId)) {
      return createErrorResponse("Invalid product ID", 400)
    }

    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get("shop_id") ? Number.parseInt(searchParams.get("shop_id")!) : undefined

    const product = await getProductById(productId, shopId)

    if (!product) {
      return createErrorResponse("Product not found", 404)
    }

    return createApiResponse(product, "Product retrieved successfully")
  } catch (error) {
    console.error("Get product error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to get product", 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const productId = Number.parseInt(params.id)
    if (isNaN(productId)) {
      return createErrorResponse("Invalid product ID", 400)
    }

    const body = await request.json()

    // Validate unit_price if provided
    if (body.unit_price && (typeof body.unit_price !== "number" || body.unit_price <= 0)) {
      return createErrorResponse("unit_price must be a positive number", 400)
    }

    // Validate MRP if provided
    if (body.mrp && body.unit_price && body.mrp < body.unit_price) {
      return createErrorResponse("MRP must be greater than or equal to unit_price", 400)
    }

    const updates: any = {}

    // Only include fields that are provided and valid
    if (body.name) updates.name = body.name.trim()
    if (body.description !== undefined) updates.description = body.description?.trim()
    if (body.brand !== undefined) updates.brand = body.brand?.trim()
    if (body.category !== undefined) updates.category = body.category?.trim()
    if (body.potency !== undefined) updates.potency = body.potency?.trim()
    if (body.unit_price) updates.unit_price = body.unit_price
    if (body.mrp !== undefined) updates.mrp = body.mrp
    if (Array.isArray(body.images)) updates.images = body.images
    if (Array.isArray(body.tags)) updates.tags = body.tags
    if (body.indications !== undefined) updates.indications = body.indications?.trim()
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active

    const product = await updateProduct(productId, updates)

    return createApiResponse(product, "Product updated successfully")
  } catch (error) {
    console.error("Update product error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to update product", 400)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || user.role !== "admin") {
      return createErrorResponse("Admin access required", 403)
    }

    const productId = Number.parseInt(params.id)
    if (isNaN(productId)) {
      return createErrorResponse("Invalid product ID", 400)
    }

    await deleteProduct(productId)

    return createApiResponse(null, "Product deleted successfully")
  } catch (error) {
    console.error("Delete product error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to delete product", 400)
  }
}
