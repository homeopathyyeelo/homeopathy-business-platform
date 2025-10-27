/**
 * User logout API endpoint
 * POST /api/auth/logout
 */
import { type NextRequest, NextResponse } from "next/server"
// import { logEvent } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    // Get user info from headers (set by middleware)
    const userId = request.headers.get("x-user-id") || undefined
    const userRole = request.headers.get("x-user-role") || undefined

    // Optionally log event; disabled for now to avoid build-time typing issues

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
