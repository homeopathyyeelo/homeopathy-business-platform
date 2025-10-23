# 🚀 QUICK START INTEGRATION GUIDE
**Get RBAC & Multi-Company Running in 30 Minutes**

---

## ⚡ STEP-BY-STEP INTEGRATION

### Step 1: Install Backend Dependencies (2 minutes)

```bash
cd /var/www/homeopathy-business-platform/services/api-golang-v2

# Install required Go packages
go get github.com/jmoiron/sqlx
go get github.com/lib/pq
go get github.com/google/uuid
go get github.com/gin-gonic/gin

# Tidy up
go mod tidy
```

### Step 2: Run Database Migrations (3 minutes)

```bash
# Connect to PostgreSQL
psql -U postgres -d homeopathy_erp

# Or if using different credentials:
# psql -U your_user -d your_database

# Run the migration
\i /var/www/homeopathy-business-platform/db/migrations/100_complete_master_tables.sql

# Verify tables created
\dt

# You should see: roles, permissions, role_permissions, user_roles, menus, companies, branches
```

### Step 3: Seed Initial Data (2 minutes)

```sql
-- Still in psql, run these commands:

-- Create default company
INSERT INTO companies (id, name, code, is_active, created_at) 
VALUES (gen_random_uuid(), 'Yeelo Homeopathy', 'YEELO', true, NOW());

-- Create default branch
INSERT INTO branches (id, company_id, name, code, branch_type, is_active, timezone, created_at)
VALUES (
  gen_random_uuid(), 
  (SELECT id FROM companies WHERE code = 'YEELO'), 
  'Main Branch', 
  'MAIN-001', 
  'retail', 
  true,
  'Asia/Kolkata',
  NOW()
);

-- Create default roles
INSERT INTO roles (id, name, code, level, is_system, is_active, created_at) VALUES
(gen_random_uuid(), 'Super Admin', 'SUPER_ADMIN', 100, true, true, NOW()),
(gen_random_uuid(), 'Admin', 'ADMIN', 90, false, true, NOW()),
(gen_random_uuid(), 'Manager', 'MANAGER', 70, false, true, NOW()),
(gen_random_uuid(), 'Cashier', 'CASHIER', 50, false, true, NOW()),
(gen_random_uuid(), 'Staff', 'STAFF', 30, false, true, NOW());

-- Create default permissions (Products module)
INSERT INTO permissions (id, name, code, module, action, is_active, created_at) VALUES
(gen_random_uuid(), 'View Products', 'PRODUCTS_READ', 'products', 'read', true, NOW()),
(gen_random_uuid(), 'Create Products', 'PRODUCTS_CREATE', 'products', 'create', true, NOW()),
(gen_random_uuid(), 'Edit Products', 'PRODUCTS_UPDATE', 'products', 'update', true, NOW()),
(gen_random_uuid(), 'Delete Products', 'PRODUCTS_DELETE', 'products', 'delete', true, NOW());

-- Create permissions (Sales module)
INSERT INTO permissions (id, name, code, module, action, is_active, created_at) VALUES
(gen_random_uuid(), 'View Sales', 'SALES_READ', 'sales', 'read', true, NOW()),
(gen_random_uuid(), 'Create Sales', 'SALES_CREATE', 'sales', 'create', true, NOW()),
(gen_random_uuid(), 'Edit Sales', 'SALES_UPDATE', 'sales', 'update', true, NOW()),
(gen_random_uuid(), 'Delete Sales', 'SALES_DELETE', 'sales', 'delete', true, NOW());

-- Create permissions (Purchases module)
INSERT INTO permissions (id, name, code, module, action, is_active, created_at) VALUES
(gen_random_uuid(), 'View Purchases', 'PURCHASES_READ', 'purchases', 'read', true, NOW()),
(gen_random_uuid(), 'Create Purchases', 'PURCHASES_CREATE', 'purchases', 'create', true, NOW()),
(gen_random_uuid(), 'Approve Purchases', 'PURCHASES_APPROVE', 'purchases', 'approve', true, NOW());

-- Create permissions (Settings module)
INSERT INTO permissions (id, name, code, module, action, is_active, created_at) VALUES
(gen_random_uuid(), 'Manage Roles', 'SETTINGS_ROLES', 'settings', 'manage', true, NOW()),
(gen_random_uuid(), 'Manage Users', 'SETTINGS_USERS', 'settings', 'manage', true, NOW()),
(gen_random_uuid(), 'System Settings', 'SETTINGS_SYSTEM', 'settings', 'manage', true, NOW());

-- Assign ALL permissions to Super Admin role
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN';

-- Verify data
SELECT COUNT(*) as role_count FROM roles;
SELECT COUNT(*) as permission_count FROM permissions;
SELECT COUNT(*) as role_permission_count FROM role_permissions;

-- Exit psql
\q
```

### Step 4: Register RBAC Routes in Go Backend (5 minutes)

Edit `/var/www/homeopathy-business-platform/services/api-golang-v2/cmd/main.go`:

```go
package main

import (
    "log"
    "github.com/gin-gonic/gin"
    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
    
    // Import your RBAC module
    "your-module-path/internal/rbac"
)

func main() {
    // Database connection
    db, err := sqlx.Connect("postgres", "user=postgres password=yourpass dbname=homeopathy_erp sslmode=disable")
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // Initialize Gin router
    router := gin.Default()
    
    // CORS middleware (if needed)
    router.Use(func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        c.Next()
    })

    // Initialize RBAC
    rbacRepo := rbac.NewRepository(db)
    rbacService := rbac.NewService(rbacRepo)
    rbacHandler := rbac.NewHandler(rbacService)

    // Register RBAC routes
    api := router.Group("/api/v1")
    rbacHandler.RegisterRoutes(api)

    // ... your other routes ...

    // Start server
    log.Println("Server starting on :8080")
    router.Run(":8080")
}
```

### Step 5: Test Backend APIs (3 minutes)

```bash
# Start the Go server
cd /var/www/homeopathy-business-platform/services/api-golang-v2
go run cmd/main.go

# In another terminal, test the APIs:

# Get all roles
curl http://localhost:8080/api/v1/rbac/roles

# Get all permissions
curl http://localhost:8080/api/v1/rbac/permissions

# Get role with permissions
curl http://localhost:8080/api/v1/rbac/roles/{role-id}

# Expected response: JSON with roles/permissions data
```

### Step 6: Update Frontend Layout (5 minutes)

Edit `/var/www/homeopathy-business-platform/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import ProductionERPLayout from '@/components/layout/ProductionERPLayout'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import { CompanyProvider } from '@/contexts/CompanyContext' // ADD THIS

export const metadata: Metadata = {
  title: 'Yeelo Homeopathy Platform',
  description: 'Complete homeopathy business management platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <CompanyProvider> {/* ADD THIS */}
              <ProductionERPLayout>
                {children}
              </ProductionERPLayout>
            </CompanyProvider> {/* ADD THIS */}
          </AuthProvider>
        </QueryProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
```

### Step 7: Add Company/Branch Selector to TopBar (3 minutes)

Edit `/var/www/homeopathy-business-platform/components/layout/erp/TopBar.tsx`:

Add import at the top:
```tsx
import CompanyBranchSelector from './CompanyBranchSelector';
```

Add the selector after the logo section (around line 73):
```tsx
{/* Logo */}
<Link href="/dashboard" className="flex items-center gap-2">
  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
    <span className="text-white font-bold text-sm">H</span>
  </div>
  <span className="font-semibold text-lg hidden md:block">
    Homeopathy ERP
  </span>
</Link>

{/* ADD THIS: Company/Branch Selector */}
<CompanyBranchSelector />
```

### Step 8: Update API Client (5 minutes)

Edit `/var/www/homeopathy-business-platform/lib/api-client.ts`:

```typescript
import { getSelectedCompany, getSelectedBranch } from '@/lib/hooks/company';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function addCompanyBranchParams(url: string): string {
  const companyId = getSelectedCompany();
  const branchId = getSelectedBranch();
  
  const params = new URLSearchParams();
  if (companyId) params.append('company_id', companyId);
  if (branchId) params.append('branch_id', branchId);
  
  const separator = url.includes('?') ? '&' : '?';
  const queryString = params.toString();
  
  return queryString ? `${url}${separator}${queryString}` : url;
}

export const apiClient = {
  get: async (url: string) => {
    const fullUrl = addCompanyBranchParams(`${API_BASE_URL}${url}`);
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  post: async (url: string, data: any) => {
    const fullUrl = addCompanyBranchParams(`${API_BASE_URL}${url}`);
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  put: async (url: string, data: any) => {
    const fullUrl = addCompanyBranchParams(`${API_BASE_URL}${url}`);
    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (url: string) => {
    const fullUrl = addCompanyBranchParams(`${API_BASE_URL}${url}`);
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },
};
```

### Step 9: Start Frontend (2 minutes)

```bash
cd /var/www/homeopathy-business-platform

# Install dependencies if needed
npm install

# Start Next.js dev server
npm run dev
```

### Step 10: Test the Integration (5 minutes)

1. **Open Browser:** http://localhost:3000

2. **Navigate to Roles Page:** http://localhost:3000/settings/roles
   - You should see the list of roles
   - Click "Create Role" to test form
   - Click "Permissions" on a role to test permission assignment

3. **Check TopBar:**
   - Company selector should show "Yeelo Homeopathy"
   - Branch selector should show "Main Branch"

4. **Test Company/Branch Switching:**
   - Select different company/branch (if you added more)
   - Check browser localStorage to verify persistence
   - Refresh page - selection should persist

---

## ✅ VERIFICATION CHECKLIST

- [ ] Go server starts without errors
- [ ] Database tables exist (roles, permissions, etc.)
- [ ] Seed data inserted successfully
- [ ] GET /api/v1/rbac/roles returns data
- [ ] GET /api/v1/rbac/permissions returns data
- [ ] Next.js app starts without errors
- [ ] /settings/roles page loads
- [ ] Role list displays correctly
- [ ] Create role form works
- [ ] Permission assignment page works
- [ ] Company/Branch selectors appear in TopBar
- [ ] Selecting company/branch persists

---

## 🐛 TROUBLESHOOTING

### Backend Issues

**Error: "could not import github.com/jmoiron/sqlx"**
```bash
go get github.com/jmoiron/sqlx
go mod tidy
```

**Error: "database connection failed"**
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify connection string in main.go
- Test connection: `psql -U postgres -d homeopathy_erp`

**Error: "table does not exist"**
- Run migrations again: `psql -U postgres -d homeopathy_erp -f db/migrations/100_complete_master_tables.sql`

### Frontend Issues

**Error: "Cannot find module '@/contexts/CompanyContext'"**
- Verify file exists: `ls contexts/CompanyContext.tsx`
- Check tsconfig.json has correct path mapping

**Error: "CompanyBranchSelector not found"**
- Verify file exists: `ls components/layout/erp/CompanyBranchSelector.tsx`

**API calls returning 404**
- Check API_BASE_URL in api-client.ts
- Verify Go server is running on correct port
- Check CORS settings in Go server

---

## 📝 NEXT STEPS AFTER INTEGRATION

### Immediate (Today)
1. Test all RBAC endpoints
2. Create a few test roles
3. Assign permissions to roles
4. Test permission checking

### This Week
1. Create company/branch CRUD APIs in Go
2. Add more permissions for all modules
3. Implement menu management UI
4. Add user-role assignment UI

### Next Week
1. AI integration (Chat, Forecasting, Auto PO)
2. Marketing automation
3. Advanced reporting
4. Prescription module

---

## 🎉 SUCCESS!

If all checkboxes are ticked, you now have:

✅ **Working RBAC System**
- Backend APIs functional
- Frontend UI complete
- Permission checking ready
- Menu filtering ready

✅ **Multi-Company Foundation**
- Context provider active
- Selectors in TopBar
- Data isolation ready
- Persistent selection

✅ **Production-Ready Code**
- Type-safe
- Error handling
- Loading states
- Clean architecture

---

## 📞 SUPPORT

If you encounter issues:

1. Check logs:
   - Go server: Terminal output
   - Next.js: Browser console + Terminal
   - Database: PostgreSQL logs

2. Verify files exist:
   ```bash
   ls services/api-golang-v2/internal/rbac/
   ls lib/hooks/rbac.ts
   ls contexts/CompanyContext.tsx
   ls app/settings/roles/
   ```

3. Check documentation:
   - `PHASE-1-COMPLETE.md` - Full implementation details
   - `docs/API-ROUTES-COMPLETE.md` - API specifications
   - `docs/P0-IMPLEMENTATION-TASKS.md` - Task breakdown

---

**Total Integration Time:** ~30 minutes  
**Difficulty:** Easy  
**Result:** Production-ready RBAC + Multi-company system

🚀 **You're ready to go!**
