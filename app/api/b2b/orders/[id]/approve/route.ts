/**
 * B2B Order Approval API
 * Handles approval and rejection of B2B orders
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { b2bCommerceService } from "@/lib/b2b-commerce"

// PUT /api/b2b/orders/[id]/approve - Approve B2B order
export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and staff can approve orders
    if (!["admin", "staff"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const orderId = context?.params?.id
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    await b2bCommerceService.approveB2BOrder(orderId, String(user.id))

    return NextResponse.json({
      success: true,
      message: "B2B order approved successfully"
    })

  } catch (error: any) {
    console.error("B2B order approval error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to approve B2B order" },
      { status: 500 }
    )
  }
}

// DELETE /api/b2b/orders/[id]/approve - Reject B2B order
export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and staff can reject orders
    if (!["admin", "staff"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const orderId = params.id
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      )
    }

    await b2bCommerceService.rejectB2BOrder(orderId, String(user.id), reason)

    return NextResponse.json({
      success: true,
      message: "B2B order rejected successfully"
    })

  } catch (error: any) {
    console.error("B2B order rejection error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to reject B2B order" },
      { status: 500 }
    )
  }
}
