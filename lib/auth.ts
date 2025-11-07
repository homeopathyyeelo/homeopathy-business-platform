import { NextRequest, NextResponse } from "next/server"
import {
  authServiceFetch,
  attachAuthCookies,
  clearAuthCookies,
  getUserFromHeaders,
  mapAuthServiceUser,
  validateAccessToken,
  type AuthenticatedUser,
} from "@/lib/server/auth-service"

// Permission codes for all features
export enum PermissionCode {
  // Core permissions
  DASHBOARD = "PERM_DASHBOARD",
  DASHBOARD_VIEW = "PERM_DASHBOARD_VIEW",

  // Products
  PRODUCTS_READ = "PERM_PRODUCTS_READ",
  PRODUCTS_CREATE = "PERM_PRODUCTS_CREATE",
  PRODUCTS_UPDATE = "PERM_PRODUCTS_UPDATE",
  PRODUCTS_DELETE = "PERM_PRODUCTS_DELETE",
  PRODUCTS_CATEGORIES = "PERM_PRODUCTS_CATEGORIES",
  PRODUCTS_BRANDS = "PERM_PRODUCTS_BRANDS",
  PRODUCTS_BATCHES = "PERM_PRODUCTS_BATCHES",
  PRODUCTS_PRICING = "PERM_PRODUCTS_PRICING",
  PRODUCTS_IMPORT = "PERM_PRODUCTS_IMPORT",

  // Inventory
  INVENTORY_VIEW = "PERM_INVENTORY_VIEW",
  INVENTORY_READ = "PERM_INVENTORY_READ",
  INVENTORY_STOCK = "PERM_INVENTORY_STOCK",
  INVENTORY_EXPIRE_VIEW = "PERM_INVENTORY_EXPIRE_VIEW",
  INVENTORY_BULK = "PERM_INVENTORY_BULK",
  INVENTORY_COMBO = "PERM_INVENTORY_COMBO",
  INVENTORY_ADJUST = "PERM_INVENTORY_ADJUST",
  INVENTORY_TRANSFER = "PERM_INVENTORY_TRANSFER",
  INVENTORY_DAMAGE = "PERM_INVENTORY_DAMAGE",
  STOCK_DIRECT = "PERM_STOCK_DIRECT",
  BARCODE_DESIGN = "PERM_BARCODE_DESIGN",

  // Sales
  SALES_VIEW = "PERM_SALES_VIEW",
  SALES_READ = "PERM_SALES_READ",
  SALES_CREATE = "PERM_SALES_CREATE",
  SALES_UPDATE = "PERM_SALES_UPDATE",
  SALES_DELETE = "PERM_SALES_DELETE",
  SALES_RETURN = "PERM_SALES_RETURN",
  SALES_ORDERS = "PERM_SALES_ORDERS",
  SALES_INVOICES = "PERM_SALES_INVOICES",
  SALES_RECEIPTS = "PERM_SALES_RECEIPTS",
  POS_USE = "PERM_POS_USE",
  POS_DUAL = "PERM_POS_DUAL",
  POS_HOLD = "PERM_POS_HOLD",
  SALES_CONVERT = "PERM_SALES_CONVERT",
  SALES_TEMPLATE = "PERM_SALES_TEMPLATE",
  SALES_GIFTCARD = "PERM_SALES_GIFTCARD",

  // Purchases
  PURCHASES_VIEW = "PERM_PURCHASES_VIEW",
  PURCHASES_READ = "PERM_PURCHASE_READ",
  PURCHASES_CREATE = "PERM_PURCHASE_CREATE",
  PURCHASES_UPDATE = "PERM_PURCHASES_UPDATE",
  PURCHASES_DELETE = "PERM_PURCHASES_DELETE",
  PURCHASES_ORDERS = "PERM_PURCHASES_ORDERS",
  PURCHASES_GRN = "PERM_PURCHASES_GRN",
  PURCHASES_RECEIVE = "PERM_PURCHASES_RECEIVE",
  PURCHASES_RECON = "PERM_PURCHASE_RECON",
  PURCHASES_RETURN = "PERM_PURCHASE_RETURN",
  PURCHASES_VENDORS = "PERM_PURCHASES_VENDORS",
  PURCHASES_PAYMENTS = "PERM_PURCHASES_PAYMENTS",
  PURCHASES_COMPARISON = "PERM_PURCHASES_COMPARISON",
  PURCHASES_HISTORY = "PERM_PURCHASES_HISTORY",
  PURCHASES_AI = "PERM_PURCHASES_AI",

  // Customers
  CUSTOMERS_VIEW = "PERM_CUSTOMERS_VIEW",
  CUSTOMERS_READ = "PERM_CUSTOMERS_READ",
  CUSTOMERS_CREATE = "PERM_CUSTOMERS_CREATE",
  CUSTOMERS_UPDATE = "PERM_CUSTOMERS_UPDATE",
  CUSTOMERS_DELETE = "PERM_CUSTOMERS_DELETE",
  CUSTOMERS_GROUPS = "PERM_CUSTOMERS_GROUPS",
  CUSTOMERS_LOYALTY = "PERM_CUSTOMERS_LOYALTY",
  CUSTOMERS_BULK_EDIT = "PERM_CUSTOMERS_BULK_EDIT",
  CUSTOMERS_LEDGER = "PERM_CUSTOMERS_LEDGER",

  // Vendors
  VENDORS_VIEW = "PERM_VENDORS_VIEW",
  VENDORS_READ = "PERM_VENDORS_READ",
  VENDORS_CREATE = "PERM_VENDORS_CREATE",
  VENDORS_UPDATE = "PERM_VENDORS_UPDATE",
  VENDORS_DELETE = "PERM_VENDORS_DELETE",
  VENDORS_LEDGER = "PERM_VENDORS_LEDGER",
  VENDORS_PERFORMANCE = "PERM_VENDORS_PERFORMANCE",
  VENDORS_BULK_UPDATE = "PERM_VENDORS_BULK_UPDATE",

  // Finance
  FINANCE_VIEW = "PERM_FINANCE_VIEW",
  FINANCE_READ = "PERM_FINANCE_READ",
  FINANCE_WRITE = "PERM_FINANCE_WRITE",
  FINANCE_LEDGERS = "PERM_FINANCE_LEDGERS",
  FINANCE_EXPENSES = "PERM_FINANCE_EXPENSES",
  FINANCE_COMMISSION = "PERM_FINANCE_COMMISSION",
  FINANCE_CREDIT = "PERM_FINANCE_CREDIT",
  FINANCE_GATEWAY = "PERM_FINANCE_GATEWAY",
  FINANCE_BANK_RECON = "PERM_FINANCE_BANK_RECON",
  FINANCE_GST = "PERM_FINANCE_GST",
  FINANCE_REPORTS = "PERM_FINANCE_REPORTS",
  SUPPLIER_PAY = "PERM_SUPPLIER_PAY",

  // HR
  HR_VIEW = "PERM_HR_VIEW",
  HR_READ = "PERM_HR_READ",
  HR_WRITE = "PERM_HR_WRITE",
  HR_EMPLOYEES = "PERM_HR_EMPLOYEES",
  HR_ATTENDANCE = "PERM_HR_ATTENDANCE",
  HR_PAYROLL = "PERM_HR_PAYROLL",
  HR_LEAVES = "PERM_HR_LEAVES",
  HR_PERFORMANCE = "PERM_HR_PERFORMANCE",

  // Reports
  REPORTS_VIEW = "PERM_REPORTS_VIEW",
  REPORTS_SALES = "PERM_REPORTS_SALES",
  REPORTS_PURCHASE = "PERM_REPORTS_PURCHASE",
  REPORTS_INVENTORY = "PERM_REPORTS_INVENTORY",
  REPORTS_FINANCE = "PERM_REPORTS_FINANCE",
  REPORTS_GST = "PERM_REPORTS_GST",
  REPORTS_PROFIT_LOSS = "PERM_REPORTS_PROFIT_LOSS",
  REPORTS_BALANCE_SHEET = "PERM_REPORTS_BALANCE_SHEET",
  REPORTS_CUSTOM = "PERM_REPORTS_CUSTOM",

  // Analytics
  ANALYTICS_VIEW = "PERM_ANALYTICS_VIEW",
  ANALYTICS_SALES = "PERM_ANALYTICS_SALES",
  ANALYTICS_INVENTORY = "PERM_ANALYTICS_INVENTORY",
  ANALYTICS_CUSTOMER = "PERM_ANALYTICS_CUSTOMER",
  ANALYTICS_FORECASTING = "PERM_ANALYTICS_FORECASTING",
  ANALYTICS_KPIS = "PERM_ANALYTICS_KPIS",

  // Marketing
  MARKETING_VIEW = "PERM_MARKETING_VIEW",
  MARKETING_READ = "PERM_MARKETING_READ",
  MARKETING_WRITE = "PERM_MARKETING_WRITE",
  MARKETING_CAMPAIGNS = "PERM_MARKETING_CAMPAIGNS",
  MARKETING_CATALOGUE = "PERM_MARKETING_CATALOGUE",
  MARKETING_WHATSAPP = "PERM_MARKETING_WHATSAPP",
  MARKETING_WHATSAPP_SCHEDULE = "PERM_MARKETING_WHATSAPP_SCHEDULE",
  MARKETING_SMS = "PERM_MARKETING_SMS",
  MARKETING_EMAIL = "PERM_MARKETING_EMAIL",
  MARKETING_TEMPLATES = "PERM_MARKETING_TEMPLATES",

  // CRM
  CRM_READ = "PERM_CRM_READ",
  CRM_WRITE = "PERM_CRM_WRITE",
  CRM_VIEW = "PERM_CRM_VIEW",
  CRM_WHATSAPP = "PERM_CRM_WHATSAPP",
  CRM_LOYALTY = "PERM_CRM_LOYALTY",
  CRM_BULK_EDIT = "PERM_CRM_BULK_EDIT",

  // AI
  AI_READ = "PERM_AI_READ",
  AI_WRITE = "PERM_AI_WRITE",
  AI_VIEW = "PERM_AI_VIEW",
  AI_INSIGHTS = "PERM_AI_INSIGHTS",
  AI_AUTO_FIX = "PERM_AI_AUTO_FIX",
  AI_IMAGE_UPDATE = "PERM_AI_IMAGE_UPDATE",
  AI_EXPIRY_PREDICT = "PERM_AI_EXPIRY_PREDICT",
  AI_CHAT = "PERM_AI_CHAT",

  // Prescriptions
  PRESCRIPTIONS_VIEW = "PERM_PRESCRIPTIONS_VIEW",
  PRESCRIPTIONS_CREATE = "PERM_PRESCRIPTIONS_CREATE",
  PRESCRIPTIONS_UPDATE = "PERM_PRESCRIPTIONS_UPDATE",
  PRESCRIPTIONS_DELETE = "PERM_PRESCRIPTIONS_DELETE",
  PRESCRIPTIONS_HISTORY = "PERM_PRESCRIPTIONS_HISTORY",
  PRESCRIPTIONS_AI = "PERM_PRESCRIPTIONS_AI",

  // System
  SYSTEM_READ = "PERM_SYSTEM_READ",
  SYSTEM_WRITE = "PERM_SYSTEM_WRITE",
  SYSTEM_HEALTH = "PERM_SYSTEM_HEALTH",
  SYSTEM_MULTIPC = "PERM_SYSTEM_MULTIPC",
  SYSTEM_OFFLINE = "PERM_SYSTEM_OFFLINE",
  SYSTEM_BUGS = "PERM_SYSTEM_BUGS",
  SYSTEM_BUGS_READ = "PERM_SYSTEM_BUGS_READ",
  SYSTEM_BUGS_APPROVE = "PERM_SYSTEM_BUGS_APPROVE",
  SYSTEM_AUDIT = "PERM_SYSTEM_AUDIT",
  SYSTEM_BACKUP = "PERM_SYSTEM_BACKUP",

  // Settings
  SETTINGS_READ = "PERM_SETTINGS_READ",
  SETTINGS_WRITE = "PERM_SETTINGS_WRITE",
  SETTINGS_COMPANY = "PERM_SETTINGS_COMPANY",
  SETTINGS_BRANCHES = "PERM_SETTINGS_BRANCHES",
  SETTINGS_USERS = "PERM_SETTINGS_USERS",
  SETTINGS_ROLES = "PERM_SETTINGS_ROLES",
  SETTINGS_TAX = "PERM_SETTINGS_TAX",
  SETTINGS_INTEGRATIONS = "PERM_SETTINGS_INTEGRATIONS",
  SETTINGS_NOTIFICATIONS = "PERM_SETTINGS_NOTIFICATIONS",
  SETTINGS_SECURITY = "PERM_SETTINGS_SECURITY",

  // Admin
  USERS_ADMIN = "PERM_USERS_ADMIN",
  ROLES_ADMIN = "PERM_ROLES_ADMIN",
  PERMISSIONS_ADMIN = "PERM_PERMISSIONS_ADMIN",
  AUDIT_READ = "PERM_AUDIT_READ"
}

// User roles enum
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
  MARKETER = "MARKETER",
  CASHIER = "CASHIER",
  DOCTOR = "DOCTOR",
  PHARMACIST = "PHARMACIST",
  CUSTOMER = "CUSTOMER",
}

// User interface
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  shopId?: string
  isActive: boolean
  permissions?: string[]
  isSuperAdmin?: boolean
}

/**
 * Check if user has required permission
 */
export function hasPermission(user: User, requiredPermission: PermissionCode): boolean {
  if (!user) return false

  if (user.isSuperAdmin) return true

  // Admin has all permissions
  if (user.role === UserRole.ADMIN) return true

  // Check direct permissions if available
  if (user.permissions) {
    return user.permissions.includes(requiredPermission)
  }

  // Fallback to role-based permissions
  return getRolePermissions(user.role).includes(requiredPermission)
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(user: User, requiredPermissions: PermissionCode[]): boolean {
  return requiredPermissions.some(permission => hasPermission(user, permission))
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(user: User, requiredPermissions: PermissionCode[]): boolean {
  return requiredPermissions.every(permission => hasPermission(user, permission))
}

/**
 * Get default permissions for a role
 */
export function getRolePermissions(role: UserRole): PermissionCode[] {
  switch (role) {
    case UserRole.ADMIN:
      return Object.values(PermissionCode)

    case UserRole.MANAGER:
      return [
        // Dashboard
        PermissionCode.DASHBOARD,

        // Products
        PermissionCode.PRODUCTS_READ,
        PermissionCode.PRODUCTS_CREATE,
        PermissionCode.PRODUCTS_UPDATE,
        PermissionCode.PRODUCTS_CATEGORIES,
        PermissionCode.PRODUCTS_BRANDS,
        PermissionCode.PRODUCTS_BATCHES,
        PermissionCode.PRODUCTS_PRICING,

        // Inventory
        PermissionCode.INVENTORY_VIEW,
        PermissionCode.INVENTORY_STOCK,
        PermissionCode.INVENTORY_EXPIRE_VIEW,
        PermissionCode.INVENTORY_BULK,
        PermissionCode.INVENTORY_COMBO,
        PermissionCode.INVENTORY_ADJUST,
        PermissionCode.INVENTORY_TRANSFER,
        PermissionCode.INVENTORY_DAMAGE,
        PermissionCode.STOCK_DIRECT,

        // Sales
        PermissionCode.SALES_VIEW,
        PermissionCode.SALES_CREATE,
        PermissionCode.SALES_UPDATE,
        PermissionCode.SALES_ORDERS,
        PermissionCode.SALES_INVOICES,
        PermissionCode.SALES_RECEIPTS,
        PermissionCode.POS_USE,
        PermissionCode.POS_HOLD,
        PermissionCode.SALES_CONVERT,
        PermissionCode.SALES_TEMPLATE,
        PermissionCode.SALES_GIFTCARD,

        // Purchases
        PermissionCode.PURCHASES_VIEW,
        PermissionCode.PURCHASES_CREATE,
        PermissionCode.PURCHASES_UPDATE,
        PermissionCode.PURCHASES_ORDERS,
        PermissionCode.PURCHASES_GRN,
        PermissionCode.PURCHASES_VENDORS,
        PermissionCode.PURCHASES_PAYMENTS,
        PermissionCode.PURCHASES_COMPARISON,
        PermissionCode.PURCHASES_HISTORY,
        PermissionCode.PURCHASES_AI,

        // Customers
        PermissionCode.CUSTOMERS_VIEW,
        PermissionCode.CUSTOMERS_READ,
        PermissionCode.CUSTOMERS_CREATE,
        PermissionCode.CUSTOMERS_UPDATE,
        PermissionCode.CUSTOMERS_GROUPS,
        PermissionCode.CUSTOMERS_LOYALTY,
        PermissionCode.CUSTOMERS_BULK_EDIT,
        PermissionCode.CUSTOMERS_LEDGER,

        // Vendors
        PermissionCode.VENDORS_VIEW,
        PermissionCode.VENDORS_READ,
        PermissionCode.VENDORS_CREATE,
        PermissionCode.VENDORS_UPDATE,
        PermissionCode.VENDORS_LEDGER,
        PermissionCode.VENDORS_PERFORMANCE,
        PermissionCode.VENDORS_BULK_UPDATE,

        // Finance
        PermissionCode.FINANCE_VIEW,
        PermissionCode.FINANCE_READ,
        PermissionCode.FINANCE_WRITE,
        PermissionCode.FINANCE_LEDGERS,
        PermissionCode.FINANCE_EXPENSES,
        PermissionCode.FINANCE_COMMISSION,
        PermissionCode.FINANCE_CREDIT,
        PermissionCode.FINANCE_GATEWAY,
        PermissionCode.FINANCE_BANK_RECON,
        PermissionCode.FINANCE_GST,
        PermissionCode.FINANCE_REPORTS,

        // HR
        PermissionCode.HR_VIEW,
        PermissionCode.HR_READ,
        PermissionCode.HR_WRITE,
        PermissionCode.HR_EMPLOYEES,
        PermissionCode.HR_ATTENDANCE,
        PermissionCode.HR_PAYROLL,
        PermissionCode.HR_LEAVES,
        PermissionCode.HR_PERFORMANCE,

        // Reports
        PermissionCode.REPORTS_VIEW,
        PermissionCode.REPORTS_SALES,
        PermissionCode.REPORTS_PURCHASE,
        PermissionCode.REPORTS_INVENTORY,
        PermissionCode.REPORTS_FINANCE,
        PermissionCode.REPORTS_GST,
        PermissionCode.REPORTS_PROFIT_LOSS,
        PermissionCode.REPORTS_BALANCE_SHEET,
        PermissionCode.REPORTS_CUSTOM,

        // Analytics
        PermissionCode.ANALYTICS_VIEW,
        PermissionCode.ANALYTICS_SALES,
        PermissionCode.ANALYTICS_INVENTORY,
        PermissionCode.ANALYTICS_CUSTOMER,
        PermissionCode.ANALYTICS_FORECASTING,
        PermissionCode.ANALYTICS_KPIS,

        // Marketing
        PermissionCode.MARKETING_VIEW,
        PermissionCode.MARKETING_READ,
        PermissionCode.MARKETING_WRITE,
        PermissionCode.MARKETING_CAMPAIGNS,
        PermissionCode.MARKETING_CATALOGUE,
        PermissionCode.MARKETING_WHATSAPP,
        PermissionCode.MARKETING_WHATSAPP_SCHEDULE,
        PermissionCode.MARKETING_SMS,
        PermissionCode.MARKETING_EMAIL,
        PermissionCode.MARKETING_TEMPLATES,

        // CRM
        PermissionCode.CRM_VIEW,
        PermissionCode.CRM_READ,
        PermissionCode.CRM_WRITE,
        PermissionCode.CRM_WHATSAPP,
        PermissionCode.CRM_LOYALTY,
        PermissionCode.CRM_BULK_EDIT,

        // AI
        PermissionCode.AI_VIEW,
        PermissionCode.AI_READ,
        PermissionCode.AI_WRITE,
        PermissionCode.AI_INSIGHTS,
        PermissionCode.AI_CHAT,

        // Prescriptions
        PermissionCode.PRESCRIPTIONS_VIEW,
        PermissionCode.PRESCRIPTIONS_CREATE,
        PermissionCode.PRESCRIPTIONS_UPDATE,
        PermissionCode.PRESCRIPTIONS_HISTORY,
        PermissionCode.PRESCRIPTIONS_AI,

        // System
        PermissionCode.SYSTEM_READ,
        PermissionCode.SYSTEM_HEALTH,
        PermissionCode.SYSTEM_MULTIPC,
        PermissionCode.SYSTEM_OFFLINE,
        PermissionCode.SYSTEM_BUGS,
        PermissionCode.SYSTEM_AUDIT,
        PermissionCode.SYSTEM_BACKUP,

        // Settings
        PermissionCode.SETTINGS_READ,
        PermissionCode.SETTINGS_WRITE,
        PermissionCode.SETTINGS_COMPANY,
        PermissionCode.SETTINGS_BRANCHES,
        PermissionCode.SETTINGS_USERS,
        PermissionCode.SETTINGS_TAX,
        PermissionCode.SETTINGS_INTEGRATIONS,
        PermissionCode.SETTINGS_NOTIFICATIONS,
        PermissionCode.SETTINGS_SECURITY
      ]

    case UserRole.DOCTOR:
      return [
        PermissionCode.DASHBOARD,
        PermissionCode.PRODUCTS_READ,
        PermissionCode.INVENTORY_VIEW,
        PermissionCode.INVENTORY_EXPIRE_VIEW,
        PermissionCode.SALES_VIEW,
        PermissionCode.SALES_CREATE,
        PermissionCode.SALES_INVOICES,
        PermissionCode.POS_USE,
        PermissionCode.CUSTOMERS_VIEW,
        PermissionCode.CUSTOMERS_READ,
        PermissionCode.CUSTOMERS_CREATE,
        PermissionCode.PRESCRIPTIONS_VIEW,
        PermissionCode.PRESCRIPTIONS_CREATE,
        PermissionCode.PRESCRIPTIONS_UPDATE,
        PermissionCode.PRESCRIPTIONS_HISTORY,
        PermissionCode.PRESCRIPTIONS_AI,
        PermissionCode.REPORTS_VIEW,
        PermissionCode.REPORTS_SALES,
        PermissionCode.ANALYTICS_VIEW,
        PermissionCode.ANALYTICS_SALES
      ]

    case UserRole.PHARMACIST:
      return [
        PermissionCode.DASHBOARD,
        PermissionCode.PRODUCTS_READ,
        PermissionCode.PRODUCTS_CATEGORIES,
        PermissionCode.PRODUCTS_BRANDS,
        PermissionCode.INVENTORY_VIEW,
        PermissionCode.INVENTORY_STOCK,
        PermissionCode.INVENTORY_EXPIRE_VIEW,
        PermissionCode.INVENTORY_BULK,
        PermissionCode.INVENTORY_COMBO,
        PermissionCode.INVENTORY_ADJUST,
        PermissionCode.INVENTORY_DAMAGE,
        PermissionCode.SALES_VIEW,
        PermissionCode.SALES_CREATE,
        PermissionCode.SALES_INVOICES,
        PermissionCode.POS_USE,
        PermissionCode.POS_HOLD,
        PermissionCode.CUSTOMERS_VIEW,
        PermissionCode.CUSTOMERS_READ,
        PermissionCode.CUSTOMERS_CREATE,
        PermissionCode.VENDORS_VIEW,
        PermissionCode.VENDORS_READ,
        PermissionCode.REPORTS_VIEW,
        PermissionCode.REPORTS_SALES,
        PermissionCode.REPORTS_INVENTORY,
        PermissionCode.ANALYTICS_VIEW,
        PermissionCode.ANALYTICS_SALES,
        PermissionCode.ANALYTICS_INVENTORY
      ]

    case UserRole.MARKETER:
      return [
        PermissionCode.DASHBOARD,
        PermissionCode.CUSTOMERS_VIEW,
        PermissionCode.CUSTOMERS_READ,
        PermissionCode.CUSTOMERS_BULK_EDIT,
        PermissionCode.MARKETING_VIEW,
        PermissionCode.MARKETING_READ,
        PermissionCode.MARKETING_WRITE,
        PermissionCode.MARKETING_CAMPAIGNS,
        PermissionCode.MARKETING_CATALOGUE,
        PermissionCode.MARKETING_WHATSAPP,
        PermissionCode.MARKETING_WHATSAPP_SCHEDULE,
        PermissionCode.MARKETING_SMS,
        PermissionCode.MARKETING_EMAIL,
        PermissionCode.MARKETING_TEMPLATES,
        PermissionCode.CRM_VIEW,
        PermissionCode.CRM_READ,
        PermissionCode.CRM_WRITE,
        PermissionCode.CRM_WHATSAPP,
        PermissionCode.CRM_LOYALTY,
        PermissionCode.CRM_BULK_EDIT,
        PermissionCode.REPORTS_VIEW,
        PermissionCode.REPORTS_SALES,
        PermissionCode.REPORTS_CUSTOM,
        PermissionCode.ANALYTICS_VIEW,
        PermissionCode.ANALYTICS_SALES,
        PermissionCode.ANALYTICS_CUSTOMER
      ]

    case UserRole.STAFF:
      return [
        PermissionCode.DASHBOARD,
        PermissionCode.PRODUCTS_READ,
        PermissionCode.INVENTORY_VIEW,
        PermissionCode.INVENTORY_STOCK,
        PermissionCode.INVENTORY_EXPIRE_VIEW,
        PermissionCode.SALES_VIEW,
        PermissionCode.SALES_CREATE,
        PermissionCode.SALES_INVOICES,
        PermissionCode.POS_USE,
        PermissionCode.CUSTOMERS_VIEW,
        PermissionCode.CUSTOMERS_READ,
        PermissionCode.CUSTOMERS_CREATE,
        PermissionCode.REPORTS_VIEW,
        PermissionCode.REPORTS_SALES,
        PermissionCode.ANALYTICS_VIEW
      ]

    case UserRole.CASHIER:
      return [
        PermissionCode.DASHBOARD,
        PermissionCode.PRODUCTS_READ,
        PermissionCode.INVENTORY_VIEW,
        PermissionCode.INVENTORY_EXPIRE_VIEW,
        PermissionCode.SALES_VIEW,
        PermissionCode.SALES_CREATE,
        PermissionCode.SALES_INVOICES,
        PermissionCode.POS_USE,
        PermissionCode.POS_HOLD,
        PermissionCode.CUSTOMERS_VIEW,
        PermissionCode.CUSTOMERS_READ,
        PermissionCode.CUSTOMERS_CREATE
      ]

    default:
      return []
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: User, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.SUPER_ADMIN]: 8,
    [UserRole.ADMIN]: 7,
    [UserRole.MANAGER]: 6,
    [UserRole.DOCTOR]: 5,
    [UserRole.PHARMACIST]: 4,
    [UserRole.MARKETER]: 3,
    [UserRole.STAFF]: 2,
    [UserRole.CASHIER]: 1,
    [UserRole.CUSTOMER]: 0,
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
  const headerUser = getUserFromHeaders(request)
  if (!headerUser) {
    return null
  }

  return mapAuthenticatedUser(headerUser)
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
      shopId: user.shopId,
      permissions: user.permissions ?? [],
      isSuperAdmin: user.isSuperAdmin ?? false,
    },
    token,
  })

  attachAuthCookies(response, { accessToken: token })

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
    let user = getUserFromRequest(request)
    if (!user) {
      const token = request.cookies.get("auth-token")?.value
      if (!token) {
        return createErrorResponse('Authentication required', 401)
      }

      const authUser = await validateAccessToken(token)
      if (!authUser) {
        return createErrorResponse('Authentication required', 401)
      }

      user = mapAuthenticatedUser(authUser)
    }

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
  return requireAuth(async (request, user) => {
    if (!hasRole(user, requiredRole)) {
      return createErrorResponse('Insufficient permissions', 403)
    }
    
    return handler(request, user)
  })
}

/**
 * Middleware to require any of the specified roles
 */
export function requireAnyRole(requiredRoles: UserRole[], handler: (request: NextRequest, user: User) => Promise<NextResponse>) {
  return requireAuth(async (request, user) => {
    if (!hasAnyRole(user, requiredRoles)) {
      return createErrorResponse('Insufficient permissions', 403)
    }
    
    return handler(request, user)
  })
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

function mapAuthenticatedUser(user: AuthenticatedUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
    isActive: true,
    permissions: user.permissions || [],
    isSuperAdmin: user.isSuperAdmin,
  }
}

function normalizeRole(role?: string | null): UserRole {
  if (!role) return UserRole.STAFF
  const normalized = role.toUpperCase().replace(/[^A-Z0-9]/g, "_")
  if (Object.values(UserRole).includes(normalized as UserRole)) {
    return normalized as UserRole
  }
  return UserRole.STAFF
}

export async function loginWithAuthService(email: string, password: string) {
  const response = await authServiceFetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    return { success: false as const, error }
  }

  const data = await response.json()
  const user = mapAuthenticatedUser(mapAuthServiceUser(data.user))

  return {
    success: true as const,
    user,
    tokens: {
      accessToken: data.token || data.accessToken,  // Support both formats
      refreshToken: data.refreshToken,
    },
  }
}

export async function registerWithAuthService(payload: {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: string
}) {
  const response = await authServiceFetch("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    return { success: false as const, error }
  }

  const data = await response.json()
  const user = mapAuthenticatedUser(mapAuthServiceUser(data.user))

  return {
    success: true as const,
    user,
    tokens: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    },
  }
}

export async function loadUserFromToken(token: string): Promise<User | null> {
  const authUser = await validateAccessToken(token)
  if (!authUser) return null
  return mapAuthenticatedUser(authUser)
}