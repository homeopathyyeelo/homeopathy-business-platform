/**
 * Product search API endpoint
 * GET /api/erp/products/search?q=search_term&shop_id=1&limit=20
 */

import type { NextRequest } from "next/server"
import { searchProducts } from "@/lib/products"
import { createApiResponse, createErrorResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("q")

    if (!searchTerm || searchTerm.trim().length < 2) {
      return createErrorResponse("Search term must be at least 2 characters long", 400)
    }

    const shopId = searchParams.get("shop_id") ? Number.parseInt(searchParams.get("shop_id")!) : undefined
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 20

    const products = await searchProducts(searchTerm.trim(), shopId, Math.min(limit, 50))

    return createApiResponse(
      {
        products,
        count: products.length,
        search_term: searchTerm.trim(),
      },
      "Search completed successfully",
    )
  } catch (error) {
    console.error("Search products error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Search failed", 500)
  }
}
