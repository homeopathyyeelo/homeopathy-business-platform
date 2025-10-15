import { NextResponse } from "next/server"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set("auth-token", "", { httpOnly: true, secure: false, path: "/", maxAge: 0 })
  return res
}

/**
 * User logout API endpoint
 * POST /api/auth/logout
 */

import { type NextRequest, NextResponse } from "next/server"
import { logEvent } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    // Get user info from headers (set by middleware)
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    // Log logout event
    if (userId) {
      await logEvent("user_logout", "user", Number.parseInt(userId), {
        role: userRole,
        ip: request.ip,
        user_agent: request.headers.get("user-agent"),
      })
    }

    // Clear auth cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    response.cookies.delete("auth-token")

    return response
  } catch (error) {
    console.error("Logout error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
      },
      { status: 500 },
    )
  }
}
