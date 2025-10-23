/**
 * Next.js Middleware for Yeelo Homeopathy Platform
 * FIXED: Proper authentication enforcement
 */

import { type NextRequest, NextResponse } from "next/server"

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/webhooks",
  "/api/health",
  "/api/purchases",
  "/api/sales",
  "/api/inventory",
  "/api/customers",
  "/api/vendors",
  "/api/products",
  "/api/finance",
  "/api/hr",
  "/api/analytics",
  "/api/reports",
  "/api/marketing",
  "/api/orders",
  "/api/receipts",
  "/api/prescriptions",
  "/api/workflows",
  "/api/master",
  "/api/masters",
  "/api/branches",
  "/api/brands",
  "/api/categories",
  "/api/dashboard",
  "/api/ai",
  "/api/ai-content",
  "/api/campaigns",
  "/api/loyalty",
  "/api/gst",
  "/api/purchase-orders",
  "/api/b2b",
  "/api/customer-service",
  "/api/delivery",
  "/api/erp",
  "/api/schemes",
  "/api/suppliers",
  "/api/warehouse",
]

// Protected routes requiring authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/products",
  "/inventory",
  "/sales",
  "/purchases",
  "/customers",
  "/vendors",
  "/finance",
  "/hr",
  "/reports",
  "/analytics",
  "/marketing",
  "/crm",
  "/prescriptions",
  "/ai-chat",
  "/settings",
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }
  
  // Allow static files
  if (pathname.startsWith("/_next") || pathname.startsWith("/static")) {
    return NextResponse.next()
  }
  
  // Check for auth token
  const token = request.cookies.get("auth-token")?.value || 
                request.headers.get("authorization")?.replace("Bearer ", "")
  
  // If no token and accessing protected route, redirect to login
  if (!token && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // For API routes without token, return 401
  if (!token && pathname.startsWith("/api/") && !isPublicRoute(pathname)) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    )
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
