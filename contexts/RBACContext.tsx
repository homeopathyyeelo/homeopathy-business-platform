"use client"

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

// Permission definitions
export const PERMISSIONS = {
  // Product permissions
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_IMPORT: 'products.import',
  
  // Inventory permissions
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_TRANSFER: 'inventory.transfer',
  
  // Sales permissions
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_EDIT: 'sales.edit',
  SALES_DELETE: 'sales.delete',
  SALES_DISCOUNT: 'sales.discount',
  
  // Purchase permissions
  PURCHASE_VIEW: 'purchase.view',
  PURCHASE_CREATE: 'purchase.create',
  PURCHASE_EDIT: 'purchase.edit',
  PURCHASE_DELETE: 'purchase.delete',
  PURCHASE_APPROVE: 'purchase.approve',
  
  // Customer permissions
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',
  
  // Reports permissions
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_FINANCIAL: 'reports.financial',
  
  // Settings permissions
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SETTINGS_USERS: 'settings.users',
  SETTINGS_ROLES: 'settings.roles',
  
  // Admin permissions
  ADMIN_FULL_ACCESS: 'admin.*',
} as const

// Role hierarchy
export const ROLE_LEVELS = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MANAGER: 60,
  DOCTOR: 50,
  PHARMACIST: 40,
  MARKETER: 30,
  STAFF: 20,
  CASHIER: 10,
  CUSTOMER: 0,
} as const

// Default permissions by role
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [PERMISSIONS.ADMIN_FULL_ACCESS],
  ADMIN: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_CREATE,
    PERMISSIONS.PURCHASE_APPROVE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
  ],
  MANAGER: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_CREATE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  PHARMACIST: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.CUSTOMERS_VIEW,
  ],
  CASHIER: [
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.CUSTOMERS_VIEW,
  ],
}

interface RBACContextType {
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  hasRole: (role: string) => boolean
  hasMinRole: (role: string) => boolean
  canAccess: (resource: string, action: string) => boolean
}

const RBACContext = createContext<RBACContextType | undefined>(undefined)

export function RBACProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.isSuperAdmin) return true

    const userPermissions = user.permissions || ROLE_PERMISSIONS[user.role] || []
    
    // Check for wildcard permission
    if (userPermissions.includes('*') || userPermissions.includes('admin.*')) {
      return true
    }

    // Check exact permission
    if (userPermissions.includes(permission)) {
      return true
    }

    // Check wildcard pattern (e.g., 'products.*' matches 'products.view')
    const parts = permission.split('.')
    if (parts.length > 1) {
      const wildcard = `${parts[0]}.*`
      if (userPermissions.includes(wildcard)) {
        return true
      }
    }

    return false
  }

  // Check if user has any of the permissions
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  // Check if user has all permissions
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    if (!user) return false
    if (user.isSuperAdmin) return true
    return user.role === role
  }

  // Check if user has minimum role level
  const hasMinRole = (minRole: string): boolean => {
    if (!user) return false
    if (user.isSuperAdmin) return true
    
    const userLevel = ROLE_LEVELS[user.role as keyof typeof ROLE_LEVELS] || 0
    const requiredLevel = ROLE_LEVELS[minRole as keyof typeof ROLE_LEVELS] || 0
    
    return userLevel >= requiredLevel
  }

  // Convenience method: check if user can access resource with action
  const canAccess = (resource: string, action: string): boolean => {
    return hasPermission(`${resource}.${action}`)
  }

  const value: RBACContextType = {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasMinRole,
    canAccess,
  }

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>
}

export function useRBAC(): RBACContextType {
  const context = useContext(RBACContext)
  if (context === undefined) {
    throw new Error('useRBAC must be used within RBACProvider')
  }
  return context
}

// HOC for permission-based rendering
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  permission: string | string[]
) {
  return function PermissionProtectedComponent(props: T) {
    const { hasPermission, hasAnyPermission } = useRBAC()
    
    const allowed = Array.isArray(permission)
      ? hasAnyPermission(permission)
      : hasPermission(permission)
    
    if (!allowed) {
      return (
        <div className="p-4 text-center">
          <p className="text-gray-600">You don't have permission to access this feature.</p>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}

// Component for conditional rendering based on permissions
interface PermissionGuardProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function PermissionGuard({ 
  children, 
  permission, 
  permissions,
  requireAll = false,
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRBAC()
  
  let allowed = false
  
  if (permission) {
    allowed = hasPermission(permission)
  } else if (permissions) {
    allowed = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }
  
  if (!allowed) return <>{fallback}</>
  
  return <>{children}</>
}

// Component for role-based rendering
interface RoleGuardProps {
  children: ReactNode
  role?: string
  minRole?: string
  fallback?: ReactNode
}

export function RoleGuard({ 
  children, 
  role,
  minRole,
  fallback = null 
}: RoleGuardProps) {
  const { hasRole, hasMinRole } = useRBAC()
  
  let allowed = false
  
  if (role) {
    allowed = hasRole(role)
  } else if (minRole) {
    allowed = hasMinRole(minRole)
  }
  
  if (!allowed) return <>{fallback}</>
  
  return <>{children}</>
}
