import { NextRequest, NextResponse } from "next/server"
import { loadUserFromToken, createErrorResponse } from "@/lib/auth"
import { clearAuthCookies } from "@/lib/server/auth-service"

// Logout endpoint
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    clearAuthCookies(response)

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// Get current user endpoint
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return createErrorResponse('Not authenticated', 401)
    }

    const user = await loadUserFromToken(token)
    if (!user) {
      return createErrorResponse('Not authenticated', 401)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        isSuperAdmin: user.isSuperAdmin ?? false,
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}