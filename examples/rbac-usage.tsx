// ============================================================================
// RBAC USAGE EXAMPLES
// ============================================================================

import { PermissionGuard, RoleGuard, useRBAC, PERMISSIONS } from '@/contexts/RBACContext'
import { Button } from '@/components/ui/button'

// Example 1: Basic Permission Check in Component
// ============================================================================
export function ProductActions() {
  const { hasPermission, canAccess } = useRBAC()

  return (
    <div className="flex gap-2">
      {/* Show button only if user can edit products */}
      {hasPermission(PERMISSIONS.PRODUCTS_EDIT) && (
        <Button>Edit Product</Button>
      )}

      {/* Alternative syntax */}
      {canAccess('products', 'delete') && (
        <Button variant="destructive">Delete</Button>
      )}
    </div>
  )
}

// Example 2: Using PermissionGuard Component
// ============================================================================
export function InventoryPage() {
  return (
    <div>
      <h1>Inventory</h1>

      {/* Show content only if user has permission */}
      <PermissionGuard permission={PERMISSIONS.INVENTORY_VIEW}>
        <InventoryTable />
      </PermissionGuard>

      {/* Show fallback if no permission */}
      <PermissionGuard 
        permission={PERMISSIONS.INVENTORY_ADJUST}
        fallback={<p>You cannot adjust inventory</p>}
      >
        <AdjustInventoryButton />
      </PermissionGuard>

      {/* Require ANY of these permissions */}
      <PermissionGuard 
        permissions={[
          PERMISSIONS.INVENTORY_ADJUST,
          PERMISSIONS.INVENTORY_TRANSFER
        ]}
      >
        <AdvancedInventoryFeatures />
      </PermissionGuard>

      {/* Require ALL permissions */}
      <PermissionGuard 
        permissions={[
          PERMISSIONS.INVENTORY_VIEW,
          PERMISSIONS.INVENTORY_ADJUST
        ]}
        requireAll
      >
        <SuperAdminInventoryPanel />
      </PermissionGuard>
    </div>
  )
}

// Example 3: Using RoleGuard Component
// ============================================================================
export function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Show only for specific role */}
      <RoleGuard role="ADMIN">
        <AdminDashboard />
      </RoleGuard>

      {/* Show for users with minimum role level */}
      <RoleGuard minRole="MANAGER">
        <ManagerialReports />
      </RoleGuard>

      {/* With fallback */}
      <RoleGuard 
        minRole="PHARMACIST"
        fallback={<p>Pharmacist-only feature</p>}
      >
        <PrescriptionPanel />
      </RoleGuard>
    </div>
  )
}

// Example 4: Multiple Permission Checks
// ============================================================================
export function SalesPage() {
  const { hasAnyPermission, hasAllPermissions } = useRBAC()

  const canManageSales = hasAnyPermission([
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_EDIT,
    PERMISSIONS.SALES_DELETE,
  ])

  const canFullyManageSales = hasAllPermissions([
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_EDIT,
    PERMISSIONS.SALES_DELETE,
  ])

  return (
    <div>
      {canManageSales && <SalesManagementTools />}
      {canFullyManageSales && <AdvancedSalesFeatures />}
    </div>
  )
}

// Example 5: Role Level Checks
// ============================================================================
export function SettingsPage() {
  const { hasMinRole, hasRole } = useRBAC()

  return (
    <div>
      {/* Only ADMIN or higher */}
      {hasMinRole('ADMIN') && <SystemSettings />}

      {/* Only SUPER_ADMIN */}
      {hasRole('SUPER_ADMIN') && <DangerZone />}

      {/* MANAGER or higher */}
      {hasMinRole('MANAGER') && <TeamManagement />}
    </div>
  )
}

// Example 6: Programmatic Navigation with Permissions
// ============================================================================
import { useRouter } from 'next/navigation'

export function NavigationMenu() {
  const router = useRouter()
  const { canAccess, hasMinRole } = useRBAC()

  const handleNavigate = (path: string) => {
    // Check permission before navigating
    if (path === '/inventory' && !canAccess('inventory', 'view')) {
      alert('You don\'t have permission to access inventory')
      return
    }
    
    if (path === '/reports' && !hasMinRole('MANAGER')) {
      alert('Only managers can access reports')
      return
    }

    router.push(path)
  }

  return (
    <nav>
      {canAccess('products', 'view') && (
        <button onClick={() => handleNavigate('/products')}>
          Products
        </button>
      )}
      
      {hasMinRole('MANAGER') && (
        <button onClick={() => handleNavigate('/reports')}>
          Reports
        </button>
      )}
    </nav>
  )
}

// Example 7: Protected API Calls
// ============================================================================
export function ProductForm() {
  const { hasPermission } = useRBAC()

  const handleSubmit = async (data: any) => {
    // Check permission before making API call
    if (!hasPermission(PERMISSIONS.PRODUCTS_CREATE)) {
      alert('You don\'t have permission to create products')
      return
    }

    try {
      await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error(error)
    }
  }

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>
}

// Example 8: Conditional Form Fields
// ============================================================================
export function ProductEditForm() {
  const { hasPermission } = useRBAC()

  return (
    <form>
      <input name="name" placeholder="Product Name" />
      <input name="price" placeholder="Price" />

      {/* Only show discount field if user can apply discounts */}
      {hasPermission(PERMISSIONS.SALES_DISCOUNT) && (
        <input name="discount" placeholder="Discount %" />
      )}

      {/* Only admins can change MRP */}
      {hasPermission(PERMISSIONS.PRODUCTS_EDIT) && (
        <input name="mrp" placeholder="MRP" />
      )}
    </form>
  )
}

// ============================================================================
// HOW TO ADD RBAC TO APP
// ============================================================================

// 1. Wrap your app with RBACProvider in app/layout.tsx or app/providers.tsx:
/*
import { AuthProvider } from '@/hooks/useAuth'
import { RBACProvider } from '@/contexts/RBACContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <RBACProvider>
            {children}
          </RBACProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
*/

// 2. Use in any component:
/*
import { useRBAC, PermissionGuard, PERMISSIONS } from '@/contexts/RBACContext'

function MyComponent() {
  const { hasPermission } = useRBAC()

  return (
    <div>
      {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && <ProductList />}
    </div>
  )
}
*/

// 3. Protect routes in middleware.ts:
/*
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check auth token from cookie
  const token = request.cookies.get('auth-token')
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Parse JWT and check permissions (server-side)
  // Implement based on your JWT structure
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/products/:path*']
}
*/
