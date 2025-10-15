/**
 * User registration API endpoint
 * POST /api/auth/register
 */

import { type NextRequest, NextResponse } from "next/server"
import { createUser, validatePasswordStrength } from "@/lib/auth"
import { logEvent, validatePhoneNumber } from "@/lib/database"

interface RegisterRequest {
  full_name: string
  phone: string
  email?: string
  password: string
  role?: "admin" | "staff" | "customer" | "marketer"
}

export async function POST(request: NextRequest) {
  let body: RegisterRequest
  try {
    body = await request.json()

    // Validate required fields
    if (!body.full_name || !body.phone || !body.password) {
      return NextResponse.json(
        {
          success: false,
          error: "Full name, phone number, and password are required",
        },
        { status: 400 },
      )
    }

    // Validate phone number format
    if (!validatePhoneNumber(body.phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number format",
        },
        { status: 400 },
      )
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(body.password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Password does not meet requirements",
          details: passwordValidation.errors,
        },
        { status: 400 },
      )
    }

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      )
    }

    // Create user
    const user = await createUser({
      full_name: body.full_name.trim(),
      phone: body.phone,
      email: body.email?.trim(),
      password: body.password,
      role: body.role || "customer",
    })

    // Log user registration event
    await logEvent("user_registered", "user", user.id, {
      phone: user.phone,
      role: user.role,
      ip: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    // Return user data (without password hash)
    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          uuid: user.uuid,
          full_name: user.full_name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
        },
        message: "User registered successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)

    // Log failed registration attempt
    await logEvent("user_registration_failed", "user", null, {
      phone: body?.phone,
      error: error instanceof Error ? error.message : "Unknown error",
      ip: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      },
      { status: 400 },
    )
  }
}
