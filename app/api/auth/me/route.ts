import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest, createErrorResponse } from "@/lib/auth"

// Logout endpoint
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// Get current user endpoint
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
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
        shopId: user.shopId
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}