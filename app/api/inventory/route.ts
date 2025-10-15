/**
 * Inventory management API endpoints
 * GET /api/inventory?shop_id=1 - Get inventory for a shop
 * POST /api/inventory/update - Update inventory
 */

import type { NextRequest } from "next/server"
import { getShopInventory, updateInventory, bulkUpdateInventory } from "@/lib/products"
import { createApiResponse, createErrorResponse, getUserFromRequest } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get("shop_id")

    if (!shopId) {
      return createErrorResponse("shop_id is required", 400)
    }

    const inventory = await getShopInventory(Number.parseInt(shopId))

    return createApiResponse(
      {
        inventory,
        shop_id: Number.parseInt(shopId),
        count: inventory.length,
      },
      "Inventory retrieved successfully",
    )
  } catch (error) {
    console.error("Get inventory error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to get inventory", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()

    if (!body.shop_id) {
      return createErrorResponse("shop_id is required", 400)
    }

    // Handle bulk updates
    if (Array.isArray(body.updates)) {
      const result = await bulkUpdateInventory(body.shop_id, body.updates, user.id)
      return createApiResponse(result, "Bulk inventory update completed")
    }

    // Handle single update
    if (!body.sku || typeof body.change !== "number" || !body.reason) {
      return createErrorResponse("sku, change (number), and reason are required", 400)
    }

    const inventory = await updateInventory(
      body.shop_id,
      {
        sku: body.sku,
        change: body.change,
        reason: body.reason,
        vendor: body.vendor,
      },
      user.id,
    )

    return createApiResponse(inventory, "Inventory updated successfully")
  } catch (error) {
    console.error("Update inventory error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to update inventory", 400)
  }
}
