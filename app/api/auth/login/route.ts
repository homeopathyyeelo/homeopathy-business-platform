import { NextRequest, NextResponse } from "next/server"
import { authenticateUser, getUserFromRequest, createAuthResponse, createErrorResponse } from "@/lib/auth"

// Login endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }
    
    const authResult = authenticateUser(email, password)
    if (!authResult) {
      return createErrorResponse('Invalid credentials', 401)
    }
    
    return createAuthResponse(authResult.user, authResult.token)
  } catch (error) {
    console.error('Login error:', error)
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