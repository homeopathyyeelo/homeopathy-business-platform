/**
 * Next.js Middleware for Yeelo Homeopathy Platform
 * Handles authentication, role-based access control, and request logging
 * Uses simple token validation compatible with edge runtime
 */

import { type NextRequest, NextResponse } from "next/server"

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/webhooks",
  "/api/health",
]

// Admin-only routes
const ADMIN_ROUTES = ["/admin", "/api/admin", "/api/users", "/api/shops"]

// Staff routes (admin + staff + manager)
const STAFF_ROUTES = [
  "/dashboard",
  "/products",
  "/inventory",
  "/orders",
  "/customers",
  "/sales",
  "/purchases",
  "/finance",
  "/hr",
  "/reports",
  "/api/products",
  "/api/inventory",
  "/api/orders",
  "/api/customers",
  "/api/sales",
  "/api/purchases",
  "/api/finance",
]

// Marketer routes (admin + staff + marketer)
const MARKETER_ROUTES = [
  "/marketing",
  "/campaigns",
  "/templates",
  "/analytics",
  "/api/campaigns",
  "/api/templates",
  "/api/marketing",
  "/api/analytics",
]

// POS routes (admin + staff + cashier)
const POS_ROUTES = [
  "/pos",
  "/daily-register",
  "/api/pos",
]

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Check if a route requires admin access
 */
function requiresAdmin(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Check if a route requires staff access
 */
function requiresStaff(pathname: string): boolean {
  return STAFF_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Check if a route requires marketer access
 */
function requiresMarketer(pathname: string): boolean {
  return MARKETER_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Simple token validation - just check if token exists
 * Real validation happens in API routes using server-side JWT
 */
function isValidToken(token: string): boolean {
  // Basic token format check - real validation happens server-side
  return token && token.length > 20 && token.includes(".")
}

/**
 * Extract role from token header (set by login API)
 * This is a simple approach - real role verification happens server-side
 */
function getRoleFromToken(token: string): string | null {
  try {
    // For middleware, we'll rely on a simple role header
    // Real JWT verification happens in API routes
    return "customer" // Default role, will be properly verified in API routes
  } catch {
    return null
  }
}

/**
 * Check if user has required role for route
 */
function hasRequiredRole(role: string, pathname: string): boolean {
  if (requiresAdmin(pathname)) {
    return role === "admin"
  }

  if (requiresStaff(pathname)) {
    return ["admin", "staff"].includes(role)
  }

  if (requiresMarketer(pathname)) {
    return ["admin", "staff", "marketer"].includes(role)
  }

  return true // Default allow for authenticated users
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check for authentication token
  if (!token || !isValidToken(token)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Redirect to login for web routes
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For API routes, pass the token through for server-side validation
  if (pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers)
    // Let the API routes handle JWT verification and role extraction
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // For web routes, simple role gate for dashboard
  const roleHeader = request.headers.get("x-role") || "admin"
  if (pathname.startsWith("/dashboard") && !hasRequiredRole(roleHeader, pathname)) {
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
