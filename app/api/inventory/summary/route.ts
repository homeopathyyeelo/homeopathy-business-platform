/**
 * Inventory summary API endpoint
 * GET /api/inventory/summary?shop_id=1
 */

import type { NextRequest } from "next/server"
import { getInventorySummary } from "@/lib/products"
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

    const summary = await getInventorySummary(Number.parseInt(shopId))

    return createApiResponse(
      {
        ...summary,
        shop_id: Number.parseInt(shopId),
      },
      "Inventory summary retrieved successfully",
    )
  } catch (error) {
    console.error("Get inventory summary error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to get inventory summary", 500)
  }
}
