/**
 * Change user password API endpoint
 * POST /api/auth/change-password
 */

import { type NextRequest, NextResponse } from "next/server"
import { changePassword, validatePasswordStrength } from "@/lib/auth"
import { logEvent } from "@/lib/database"

interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ChangePasswordRequest = await request.json()

    // Get user ID from headers (set by middleware)
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 },
      )
    }

    // Validate request body
    if (!body.current_password || !body.new_password) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password and new password are required",
        },
        { status: 400 },
      )
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(body.new_password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "New password does not meet requirements",
          details: passwordValidation.errors,
        },
        { status: 400 },
      )
    }

    // Change password
    await changePassword(Number.parseInt(userId), body.current_password, body.new_password)

    // Log password change event
    await logEvent("password_changed", "user", Number.parseInt(userId), {
      ip: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Change password error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to change password",
      },
      { status: 400 },
    )
  }
}
