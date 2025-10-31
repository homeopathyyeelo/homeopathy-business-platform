import { NextRequest, NextResponse } from "next/server"
import { loginWithAuthService, loadUserFromToken, createErrorResponse } from "@/lib/auth"
import { attachAuthCookies } from "@/lib/server/auth-service"

// Login endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    const authResult = await loginWithAuthService(email, password)
    if (!authResult.success) {
      const message = authResult.error?.error || 'Invalid credentials'
      return createErrorResponse(message, 401)
    }

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
    })

    attachAuthCookies(response, authResult.tokens)

    return response
  } catch (error) {
    console.error('Login error:', error)
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
        shopId: user.shopId
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}