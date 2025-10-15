/**
 * Orders API endpoints
 * GET /api/orders - List orders with filtering and pagination
 * POST /api/orders - Create a new order
 */

import type { NextRequest } from "next/server"
import { getOrders, createOrder } from "@/lib/orders"
import { createApiResponse, createErrorResponse, getPaginationParams, getUserFromRequest } from "@/lib/api-utils"
import type { OrderFilter } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const { searchParams } = new URL(request.url)
    const pagination = getPaginationParams(request)

    // Extract filters from query parameters
    const filters: OrderFilter = {
      status: searchParams.get("status") || undefined,
      source: searchParams.get("source") || undefined,
      customer_id: searchParams.get("customer_id") ? Number.parseInt(searchParams.get("customer_id")!) : undefined,
      shop_id: searchParams.get("shop_id") ? Number.parseInt(searchParams.get("shop_id")!) : undefined,
      date_from: searchParams.get("date_from") ? new Date(searchParams.get("date_from")!) : undefined,
      date_to: searchParams.get("date_to") ? new Date(searchParams.get("date_to")!) : undefined,
    }

    const result = await getOrders(filters, pagination)

    return createApiResponse(result, "Orders retrieved successfully")
  } catch (error) {
    console.error("Get orders error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to get orders", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()

    // Validate required fields
    if (!body.customer_id || !body.shop_id || !Array.isArray(body.items) || body.items.length === 0) {
      return createErrorResponse("customer_id, shop_id, and items array are required", 400)
    }

    // Validate items
    for (const item of body.items) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        return createErrorResponse("Each item must have product_id, quantity, and unit_price", 400)
      }

      if (item.quantity <= 0 || item.unit_price <= 0) {
        return createErrorResponse("Quantity and unit_price must be positive numbers", 400)
      }
    }

    const order = await createOrder(
      {
        customer_id: body.customer_id,
        shop_id: body.shop_id,
        items: body.items,
        source: body.source || "walkin",
        delivery_type: body.delivery_type || "pickup",
        delivery_address: body.delivery_address,
        notes: body.notes,
      },
      user.id,
    )

    return createApiResponse(order, "Order created successfully", true, 201)
  } catch (error) {
    console.error("Create order error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to create order", 400)
  }
}
