/**
 * Inventory management API endpoints
 * GET /api/inventory?shop_id=1 - Get inventory for a shop
 * POST /api/inventory/update - Update inventory
 */

import type { NextRequest } from "next/server"
import { getShopInventory, updateInventory, bulkUpdateInventory } from "@/lib/products"
import { createApiResponse, createErrorResponse, getUserFromRequest } from "@/lib/api-utils"

let inventory = [
  { id: '1', productId: '1', productName: 'Arnica Montana 30C', quantity: 150, location: 'Rack A1', batch: 'B001', expiry: '2026-12-31' },
  { id: '2', productId: '2', productName: 'Belladonna 200C', quantity: 120, location: 'Rack A2', batch: 'B002', expiry: '2026-11-30' },
  { id: '3', productId: '3', productName: 'Calendula Q', quantity: 80, location: 'Rack B1', batch: 'B003', expiry: '2025-10-31' },
  { id: '4', productId: '4', productName: 'Calc Phos 6X', quantity: 200, location: 'Rack B2', batch: 'B004', expiry: '2027-01-31' },
]

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
