/**
 * User registration API endpoint
 * POST /api/auth/register
 */

import { type NextRequest, NextResponse } from "next/server"
import { registerWithAuthService, validatePasswordStrength } from "@/lib/auth"
import { logEvent, validatePhoneNumber } from "@/lib/database"
import { attachAuthCookies } from "@/lib/server/auth-service"

interface RegisterRequest {
  full_name: string
  phone: string
  email?: string
  password: string
  role?: "admin" | "staff" | "customer" | "marketer"
}

export async function POST(request: NextRequest) {
  let body: RegisterRequest | null = null
  try {
    body = await request.json()

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
        },
        { status: 400 },
      )
    }

    // Validate required fields
    if (!body.full_name || !body.phone || !body.password || !body.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Full name, phone number, email, and password are required",
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

    const [firstName, ...rest] = body.full_name.trim().split(" ")
    const lastName = rest.join(" ")

    const registerResult = await registerWithAuthService({
      email: body.email.trim(),
      password: body.password,
      firstName: firstName || body.full_name.trim(),
      lastName,
      role: body.role || "customer",
    })

    if (!registerResult.success) {
      const message = registerResult.error?.error || "Registration failed"
      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 400 },
      )
    }

    const user = registerResult.user

    // Log user registration event
    await logEvent(
      "user_registered",
      {
        phone: body.phone,
        role: user.role,
        userAgent: request.headers.get("user-agent"),
      },
      "user",
      undefined,
      undefined,
    )

    const response = NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
        message: "User registered successfully",
      },
      { status: 201 },
    )

    attachAuthCookies(response, registerResult.tokens)

    return response
  } catch (error) {
    console.error("Registration error:", error)

    // Log failed registration attempt
    if (body) {
      await logEvent(
        "user_registration_failed",
        {
          phone: body.phone,
          error: error instanceof Error ? error.message : "Unknown error",
          userAgent: request.headers.get("user-agent"),
        },
        "user",
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      },
      { status: 400 },
    )
  }
}
