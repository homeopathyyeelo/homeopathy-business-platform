import { NextRequest, NextResponse } from "next/server"

/**
 * User logout API endpoint
 * POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  try {
    // Clear auth cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })

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
