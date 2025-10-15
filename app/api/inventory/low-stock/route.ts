/**
 * Low stock products API endpoint
 * GET /api/inventory/low-stock?shop_id=1
 */

import type { NextRequest } from "next/server"
import { getLowStockProducts } from "@/lib/products"
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

    const products = await getLowStockProducts(Number.parseInt(shopId))

    return createApiResponse(
      {
        products,
        shop_id: Number.parseInt(shopId),
        count: products.length,
      },
      "Low stock products retrieved successfully",
    )
  } catch (error) {
    console.error("Get low stock products error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to get low stock products", 500)
  }
}
