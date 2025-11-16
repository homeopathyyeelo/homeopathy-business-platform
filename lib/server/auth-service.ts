import { NextResponse, type NextRequest } from "next/server"
import { authFetch } from '@/lib/api/fetch-utils';

const AUTH_SERVICE_BASE = process.env.AUTH_SERVICE_URL || "http://localhost:3005/api/auth"

export interface AuthServiceTokens {
  accessToken: string
  refreshToken?: string | null
}

export interface AuthServiceUserPayload {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  role: string
  permissions?: string[]
  isSuperAdmin?: boolean
  is_active?: boolean
  is_super_admin?: boolean
}

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  isSuperAdmin: boolean
}

export function getAuthServiceBase(): string {
  return AUTH_SERVICE_BASE
}

export function mapAuthServiceUser(data: AuthServiceUserPayload): AuthenticatedUser {
  const firstName = data.firstName ?? (data as any).first_name ?? null
  const lastName = data.lastName ?? (data as any).last_name ?? null
  const fullName =
    data.fullName ??
    (data as any).full_name ??
    ([firstName, lastName].filter(Boolean).join(" ") || data.email)

  return {
    id: data.id,
    email: data.email,
    name: fullName,
    role: (data.role || "").toUpperCase(),
    permissions: data.permissions ?? [],
    isSuperAdmin: Boolean(data.isSuperAdmin ?? data.is_super_admin ?? false),
  }
}

export function attachAuthCookies(response: NextResponse, tokens: AuthServiceTokens) {
  const secure = process.env.NODE_ENV === "production"
  const domain = process.env.NODE_ENV === "production" ? undefined : "localhost"
  
  response.cookies.set("auth-token", tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    domain, // Share cookie across all localhost ports in development
  })

  if (tokens.refreshToken) {
    response.cookies.set("auth-refresh", tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      domain, // Share cookie across all localhost ports in development
    })
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("auth-token")
  response.cookies.delete("auth-refresh")
}

export async function authServiceFetch(path: string, init?: RequestInit) {
  const url = `${getAuthServiceBase()}${path}`
  return await authFetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
}

export async function validateAccessToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const response = await authServiceFetch("/validate", {
      method: "POST",
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json()
    if (!payload?.user) {
      return null
    }

    return mapAuthServiceUser(payload.user)
  } catch (error) {
    console.error("[AuthService] validateAccessToken error", error)
    return null
  }
}

export function getUserFromHeaders(request: NextRequest): AuthenticatedUser | null {
  const encoded = request.headers.get("x-auth-user")
  if (!encoded) return null

  try {
    const json = Buffer.from(encoded, "base64").toString("utf-8")
    const parsed = JSON.parse(json)
    return mapAuthServiceUser(parsed)
  } catch (error) {
    console.error("[AuthService] Failed to parse x-auth-user header", error)
    return null
  }
}
