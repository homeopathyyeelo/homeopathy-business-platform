import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// User roles enum
export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER", 
  STAFF = "STAFF",
  MARKETER = "MARKETER",
  CASHIER = "CASHIER",
  DOCTOR = "DOCTOR",
  PHARMACIST = "PHARMACIST"
}

// User interface
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  shopId?: string
  isActive: boolean
}

// JWT payload interface
export interface JWTPayload {
  id: string
  email: string
  role: UserRole
  shopId?: string
  iat: number
  exp: number
}

// Mock users for development
const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "admin@yeelo.com",
    name: "Admin User",
    role: UserRole.ADMIN,
    shopId: "dist-yeelo",
    isActive: true
  },
  {
    id: "2", 
    email: "manager@yeelo.com",
    name: "Manager User",
    role: UserRole.MANAGER,
    shopId: "retail-a",
    isActive: true
  },
  {
    id: "3",
    email: "staff@yeelo.com", 
    name: "Staff User",
    role: UserRole.STAFF,
    shopId: "retail-a",
    isActive: true
  },
  {
    id: "4",
    email: "marketer@yeelo.com",
    name: "Marketer User", 
    role: UserRole.MARKETER,
    shopId: "dist-yeelo",
    isActive: true
  },
  {
    id: "5",
    email: "cashier@yeelo.com",
    name: "Cashier User",
    role: UserRole.CASHIER,
    shopId: "retail-b", 
    isActive: true
  },
  {
    id: "6",
    email: "doctor@yeelo.com",
    name: "Dr. Smith",
    role: UserRole.DOCTOR,
    shopId: "retail-a",
    isActive: true
  },
  {
    id: "7",
    email: "pharmacist@yeelo.com",
    name: "Pharmacist User",
    role: UserRole.PHARMACIST,
    shopId: "retail-b",
    isActive: true
  }
]

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"

/**
 * Generate JWT token for user
 */
export function generateToken(user: User): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    id: user.id,
    email: user.email,
    role: user.role,
    shopId: user.shopId
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Get user from token
 */
export function getUserFromToken(token: string): User | null {
  const payload = verifyToken(token)
  if (!payload) return null
  
  return MOCK_USERS.find(user => user.id === payload.id) || null
}

/**
 * Authenticate user with email/password
 */
export function authenticateUser(email: string, password: string): { user: User; token: string } | null {
  // For development, accept any password
  const user = MOCK_USERS.find(u => u.email === email && u.isActive)
  if (!user) return null
  
  return {
    user,
    token: generateToken(user)
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: User, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.ADMIN]: 7,
    [UserRole.MANAGER]: 6,
    [UserRole.DOCTOR]: 5,
    [UserRole.PHARMACIST]: 4,
    [UserRole.MARKETER]: 3,
    [UserRole.STAFF]: 2,
    [UserRole.CASHIER]: 1
  }
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(user: User, requiredRoles: UserRole[]): boolean {
  return requiredRoles.some(role => hasRole(user, role))
}

/**
 * Get user from request headers or cookies
 */
export function getUserFromRequest(request: NextRequest): User | null {
  // Try authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return getUserFromToken(token)
  }
  
  // Try cookie as fallback
  const cookieToken = request.cookies.get('auth-token')?.value
  if (cookieToken) {
    return getUserFromToken(cookieToken)
  }
  
  return null
}

/**
 * Create authentication response
 */
export function createAuthResponse(user: User, token: string): NextResponse {
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      shopId: user.shopId
    },
    token
  })
  
  // Set HTTP-only cookie
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })
  
  return response
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  )
}

/**
 * Middleware to require authentication
 */
export function requireAuth(handler: (request: NextRequest, user: User) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = getUserFromRequest(request)
    if (!user) {
      return createErrorResponse('Authentication required', 401)
    }
    
    return handler(request, user)
  }
}

/**
 * Middleware to require specific role
 */
export function requireRole(requiredRole: UserRole, handler: (request: NextRequest, user: User) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = getUserFromRequest(request)
    if (!user) {
      return createErrorResponse('Authentication required', 401)
    }
    
    if (!hasRole(user, requiredRole)) {
      return createErrorResponse('Insufficient permissions', 403)
    }
    
    return handler(request, user)
  }
}

/**
 * Middleware to require any of the specified roles
 */
export function requireAnyRole(requiredRoles: UserRole[], handler: (request: NextRequest, user: User) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = getUserFromRequest(request)
    if (!user) {
      return createErrorResponse('Authentication required', 401)
    }
    
    if (!hasAnyRole(user, requiredRoles)) {
      return createErrorResponse('Insufficient permissions', 403)
    }
    
    return handler(request, user)
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Change user password
 */
export function changePassword(userId: string, currentPassword: string, newPassword: string): { success: boolean; error?: string } {
  try {
    // Find user in mock database
    const user = MOCK_USERS.find((u: User) => u.id === userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Note: In development, we skip password verification for simplicity
    // In production, you'd verify the current password properly
    
    // Validate new password
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }
    
    // Note: In development, we don't actually update the password
    // In production, you'd hash and store the new password
    
    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Create new user
 */
export function createUser(userData: { email: string; password: string; name: string; role: UserRole; shopId?: string }): { success: boolean; user?: User; error?: string } {
  try {
    // Validate password
    const validation = validatePasswordStrength(userData.password);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }
    
    // Check if user already exists
    const existingUser = MOCK_USERS.find((u: User) => u.email === userData.email);
    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }
    
    // Create new user
    const newUser: User = {
      id: (MOCK_USERS.length + 1).toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      shopId: userData.shopId || "1",
      isActive: true
    };
    
    // Note: In development, we don't actually add to the mock users array
    // In production, you'd save to the database
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: 'Internal server error' };
  }
}