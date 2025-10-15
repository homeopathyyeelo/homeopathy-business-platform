/**
 * Individual order API endpoints
 * GET /api/orders/[id] - Get order by ID
 * PUT /api/orders/[id] - Update order status
 * DELETE /api/orders/[id] - Cancel order
 */

import type { NextRequest } from "next/server"
import { getOrderById, updateOrderStatus, cancelOrder } from "@/lib/orders"
import { createApiResponse, createErrorResponse, getUserFromRequest } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const orderId = Number.parseInt(params.id)
    if (isNaN(orderId)) {
      return createErrorResponse("Invalid order ID", 400)
    }

    const order = await getOrderById(orderId)

    if (!order) {
      return createErrorResponse("Order not found", 404)
    }

    return createApiResponse(order, "Order retrieved successfully")
  } catch (error) {
    console.error("Get order error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to get order", 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const orderId = Number.parseInt(params.id)
    if (isNaN(orderId)) {
      return createErrorResponse("Invalid order ID", 400)
    }

    const body = await request.json()

    if (!body.status) {
      return createErrorResponse("Status is required", 400)
    }

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]
    if (!validStatuses.includes(body.status)) {
      return createErrorResponse(`Status must be one of: ${validStatuses.join(", ")}`, 400)
    }

    const order = await updateOrderStatus(orderId, body.status, user.id)

    return createApiResponse(order, "Order status updated successfully")
  } catch (error) {
    console.error("Update order error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to update order", 400)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const orderId = Number.parseInt(params.id)
    if (isNaN(orderId)) {
      return createErrorResponse("Invalid order ID", 400)
    }

    const { searchParams } = new URL(request.url)
    const reason = searchParams.get("reason") || "Cancelled by staff"

    const order = await cancelOrder(orderId, reason, user.id)

    return createApiResponse(order, "Order cancelled successfully")
  } catch (error) {
    console.error("Cancel order error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to cancel order", 400)
  }
}
