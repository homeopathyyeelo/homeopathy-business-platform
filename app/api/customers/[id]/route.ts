/**
 * Individual customer API endpoints
 * GET /api/customers/[id] - Get customer by ID
 * PUT /api/customers/[id] - Update customer
 * DELETE /api/customers/[id] - Delete customer
 */

import type { NextRequest } from "next/server"
import { getCustomerById, updateCustomer, deleteCustomer } from "@/lib/customers"
import { createApiResponse, createErrorResponse, getUserFromRequest } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["admin", "staff", "marketer"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const customerId = Number.parseInt(params.id)
    if (isNaN(customerId)) {
      return createErrorResponse("Invalid customer ID", 400)
    }

    const customer = await getCustomerById(customerId)

    if (!customer) {
      return createErrorResponse("Customer not found", 404)
    }

    return createApiResponse(customer, "Customer retrieved successfully")
  } catch (error) {
    console.error("Get customer error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to get customer", 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const customerId = Number.parseInt(params.id)
    if (isNaN(customerId)) {
      return createErrorResponse("Invalid customer ID", 400)
    }

    const body = await request.json()

    const updates: any = {}

    // Only include fields that are provided and valid
    if (body.name) updates.name = body.name.trim()
    if (body.email !== undefined) updates.email = body.email?.trim()
    if (Array.isArray(body.addresses)) updates.addresses = body.addresses
    if (Array.isArray(body.tags)) updates.tags = body.tags
    if (typeof body.consent_marketing === "boolean") updates.consent_marketing = body.consent_marketing
    if (typeof body.consent_sms === "boolean") updates.consent_sms = body.consent_sms
    if (typeof body.consent_whatsapp === "boolean") updates.consent_whatsapp = body.consent_whatsapp
    if (body.preferred_language) updates.preferred_language = body.preferred_language

    const customer = await updateCustomer(customerId, updates)

    return createApiResponse(customer, "Customer updated successfully")
  } catch (error) {
    console.error("Update customer error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to update customer", 400)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || user.role !== "admin") {
      return createErrorResponse("Admin access required", 403)
    }

    const customerId = Number.parseInt(params.id)
    if (isNaN(customerId)) {
      return createErrorResponse("Invalid customer ID", 400)
    }

    await deleteCustomer(customerId)

    return createApiResponse(null, "Customer deleted successfully")
  } catch (error) {
    console.error("Delete customer error:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to delete customer", 400)
  }
}
