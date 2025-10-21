# 🔴 P0 CRITICAL IMPLEMENTATION TASKS
**Immediate Action Items - Start Now**

---

## TASK 1: FIX DASHBOARD RENDERING ✅
**Priority:** P0  
**Estimated Time:** 1 hour  
**Status:** CHECKING

### Issue
Dashboard page at `/dashboard` may not display content properly due to layout padding/overflow issues.

### Solution Steps
1. ✅ Verify FullLayout component padding
2. ✅ Check dashboard page rendering
3. ✅ Test all KPI cards and charts
4. ✅ Ensure responsive design works

### Files to Modify
- `/components/layout/erp/FullLayout.tsx` - Adjust padding
- `/app/dashboard/page.tsx` - Verify content structure

### Acceptance Criteria
- Dashboard loads in < 2s
- All KPI cards visible
- Charts render correctly
- No layout overflow issues

---

## TASK 2: IMPLEMENT RBAC & MENU MANAGEMENT SYSTEM
**Priority:** P0  
**Estimated Time:** 2-3 days  
**Status:** TODO

### Missing Components
1. ❌ Menu management API (Go)
2. ❌ Permission management API (Go)
3. ❌ Role assignment UI (Next.js)
4. ❌ Menu builder UI (Next.js)
5. ❌ Permission matrix UI (Next.js)

### Implementation Plan

#### Step 1: Database Schema (DONE)
```sql
-- Already exists in migration files
tables: roles, permissions, role_permissions, user_roles, menus
```

#### Step 2: Go Backend APIs
Create `/services/api-golang-v2/internal/rbac/` module:

**Files to Create:**
```
services/api-golang-v2/internal/rbac/
├── handler.go      # HTTP handlers
├── service.go      # Business logic
├── repository.go   # Database operations
└── models.go       # Data structures
```

**API Endpoints:**
```go
// Roles
GET    /api/v1/roles
POST   /api/v1/roles
GET    /api/v1/roles/:id
PUT    /api/v1/roles/:id
DELETE /api/v1/roles/:id

// Permissions
GET    /api/v1/permissions
POST   /api/v1/permissions
GET    /api/v1/permissions/:id
PUT    /api/v1/permissions/:id
DELETE /api/v1/permissions/:id

// Role Permissions
POST   /api/v1/roles/:id/permissions
GET    /api/v1/roles/:id/permissions
DELETE /api/v1/roles/:roleId/permissions/:permissionId

// Menus
GET    /api/v1/menus
POST   /api/v1/menus
GET    /api/v1/menus/:id
PUT    /api/v1/menus/:id
DELETE /api/v1/menus/:id
GET    /api/v1/menus/user/:userId  # Filtered by permissions
```

#### Step 3: Frontend Pages
Create pages in `/app/settings/`:

**Pages to Create:**
```
app/settings/
├── roles/
│   ├── page.tsx           # List all roles
│   ├── [id]/
│   │   └── page.tsx       # Edit role
│   └── new/
│       └── page.tsx       # Create role
├── permissions/
│   ├── page.tsx           # Permission matrix
│   └── assign/
│       └── page.tsx       # Assign to roles
└── menus/
    ├── page.tsx           # Menu tree
    └── builder/
        └── page.tsx       # Drag-drop menu builder
```

#### Step 4: SWR Hooks
Create hooks in `/lib/hooks/rbac.ts`:

```typescript
export function useRoles() {
  return useSWR('/api/v1/roles', fetcher);
}

export function usePermissions() {
  return useSWR('/api/v1/permissions', fetcher);
}

export function useMenus() {
  return useSWR('/api/v1/menus', fetcher);
}

export function useRolePermissions(roleId: string) {
  return useSWR(`/api/v1/roles/${roleId}/permissions`, fetcher);
}
```

### Acceptance Criteria
- ✅ Admin can create/edit/delete roles
- ✅ Admin can assign permissions to roles
- ✅ Admin can manage menu structure
- ✅ Menus filter based on user permissions
- ✅ All actions logged in audit trail

---

## TASK 3: MULTI-COMPANY & MULTI-BRANCH UI
**Priority:** P0  
**Estimated Time:** 2-3 days  
**Status:** TODO

### Missing Components
1. ❌ Company selector in TopBar
2. ❌ Branch selector in TopBar
3. ❌ Company management UI
4. ❌ Branch management UI
5. ❌ Company/branch filter in all APIs

### Implementation Plan

#### Step 1: Update TopBar Component
File: `/components/layout/erp/TopBar.tsx`

Add company and branch selectors:
```typescript
<Select value={selectedCompany} onValueChange={setSelectedCompany}>
  <SelectTrigger className="w-48">
    <Building2 className="mr-2 h-4 w-4" />
    <SelectValue placeholder="Select Company" />
  </SelectTrigger>
  <SelectContent>
    {companies.map(company => (
      <SelectItem key={company.id} value={company.id}>
        {company.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

<Select value={selectedBranch} onValueChange={setSelectedBranch}>
  <SelectTrigger className="w-48">
    <Store className="mr-2 h-4 w-4" />
    <SelectValue placeholder="Select Branch" />
  </SelectTrigger>
  <SelectContent>
    {branches.map(branch => (
      <SelectItem key={branch.id} value={branch.id}>
        {branch.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Step 2: Create Context for Company/Branch
File: `/contexts/CompanyContext.tsx`

```typescript
export const CompanyContext = createContext<CompanyContextType>({
  selectedCompany: null,
  selectedBranch: null,
  setSelectedCompany: () => {},
  setSelectedBranch: () => {},
  companies: [],
  branches: [],
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  
  const { data: companies } = useCompanies();
  const { data: branches } = useBranches(selectedCompany);
  
  return (
    <CompanyContext.Provider value={{
      selectedCompany,
      selectedBranch,
      setSelectedCompany,
      setSelectedBranch,
      companies,
      branches
    }}>
      {children}
    </CompanyContext.Provider>
  );
}
```

#### Step 3: Create Management Pages
```
app/settings/
├── companies/
│   ├── page.tsx           # List companies
│   ├── [id]/
│   │   └── page.tsx       # Edit company
│   └── new/
│       └── page.tsx       # Create company
└── branches/
    ├── page.tsx           # List branches
    ├── [id]/
    │   └── page.tsx       # Edit branch
    └── new/
        └── page.tsx       # Create branch
```

#### Step 4: Update API Client
Add company_id and branch_id to all API requests:

```typescript
export const apiClient = {
  get: (url: string) => {
    const { selectedCompany, selectedBranch } = useCompanyContext();
    const params = new URLSearchParams();
    if (selectedCompany) params.append('company_id', selectedCompany);
    if (selectedBranch) params.append('branch_id', selectedBranch);
    return fetch(`${url}?${params}`);
  },
  // ... other methods
};
```

### Acceptance Criteria
- ✅ User can switch between companies
- ✅ User can switch between branches
- ✅ All data filters by selected company/branch
- ✅ Selection persists in localStorage
- ✅ Admin can manage companies and branches

---

## TASK 4: COMPLETE AI INTEGRATION
**Priority:** P0  
**Estimated Time:** 4-5 days  
**Status:** TODO

### Missing Components
1. ❌ AI chat with RAG integration
2. ❌ Demand forecasting dashboard
3. ❌ Auto PO generation workflow
4. ❌ Price optimization UI
5. ❌ Content generation UI

### Implementation Plan

#### Phase 1: AI Chat with RAG
**Backend:** Python AI service already exists at `/services/ai-service/`

**Frontend:** Update `/app/ai-chat/page.tsx`

Features needed:
- WebSocket connection for streaming responses
- Chat history display
- File upload for context
- RAG source citations
- Conversation management

```typescript
// Use WebSocket for streaming
const ws = new WebSocket('ws://localhost:8001/ws/chat');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'chunk') {
    appendToMessage(data.content);
  } else if (data.type === 'sources') {
    displaySources(data.sources);
  }
};
```

#### Phase 2: Demand Forecasting
**Page:** `/app/ai/forecasting/page.tsx`

Features:
- Product selection
- Historical sales chart
- Forecast chart (30/60/90 days)
- Confidence intervals
- Recommended reorder quantity
- Export forecast data

**API Call:**
```typescript
POST /api/v1/ai/forecast/demand
{
  "product_id": "uuid",
  "days": 90,
  "include_seasonality": true
}

Response:
{
  "forecast": [
    {"date": "2025-01-20", "predicted_quantity": 45, "confidence_low": 40, "confidence_high": 50},
    ...
  ],
  "recommended_reorder_qty": 150,
  "reorder_date": "2025-02-01"
}
```

#### Phase 3: Auto PO Generation
**Page:** `/app/ai/po-generator/page.tsx`

Workflow:
1. AI analyzes low stock + demand forecast
2. Generates recommended POs with vendor suggestions
3. Shows approval interface
4. On approve → creates actual PO
5. Sends to vendor via email/WhatsApp

**API Flow:**
```typescript
// Step 1: Get recommendations
GET /api/v1/ai/po/recommendations

// Step 2: Approve
POST /api/v1/ai/po/recommendations/:id/approve

// Step 3: Auto-create PO
POST /api/v1/purchases/orders (triggered by approval)
```

#### Phase 4: Price Optimization
**Page:** `/app/ai/pricing/page.tsx`

Features:
- Product selection
- Current price vs recommended price
- Competitor price analysis
- Demand elasticity curve
- Profit impact simulation
- Apply pricing changes

### Acceptance Criteria
- ✅ AI chat responds with context-aware answers
- ✅ Forecasting shows accurate predictions
- ✅ Auto PO workflow generates valid purchase orders
- ✅ Price optimization provides actionable insights
- ✅ All AI requests logged for audit

---

## TASK 5: MARKETING AUTOMATION INTEGRATION
**Priority:** P1  
**Estimated Time:** 1 week  
**Status:** TODO

### Components
1. WhatsApp bulk sender
2. SMS gateway integration
3. Email campaign builder
4. Customer segmentation UI

### Quick Implementation Guide
- Use Twilio/Gupshup for WhatsApp
- Use MSG91/Twilio for SMS
- Use SendGrid/AWS SES for Email
- Build segment builder with drag-drop rules

---

## TASK 6: PRESCRIPTION MODULE (HOMEOPATHY SPECIFIC)
**Priority:** P1  
**Estimated Time:** 2 weeks  
**Status:** TODO

### Components
1. Prescription CRUD
2. Patient history
3. Remedy suggestions (AI)
4. Doctor portal
5. Prescription templates

---

## IMPLEMENTATION PRIORITY ORDER

### Week 1 (Critical)
1. ✅ Fix dashboard rendering (1 hour)
2. 🔨 Implement RBAC system (2 days)
3. 🔨 Add company/branch selector (2 days)

### Week 2 (High Priority)
4. 🔨 Complete AI chat integration (2 days)
5. 🔨 Build forecasting dashboard (2 days)
6. 🔨 Implement auto PO workflow (1 day)

### Week 3 (Important)
7. 🔨 Marketing automation (WhatsApp/SMS/Email)
8. 🔨 Customer segmentation UI
9. 🔨 Advanced reporting

### Week 4 (Enhancement)
10. 🔨 Prescription module
11. 🔨 Doctor portal
12. 🔨 Payment gateway integration

---

## NEXT IMMEDIATE ACTION

**START NOW:**
1. Verify dashboard is working
2. Create RBAC Go module
3. Build role management UI
4. Add company/branch selector to TopBar

**Developer Assignment:**
- Backend Dev: RBAC APIs + Company/Branch APIs
- Frontend Dev: Role management UI + Company selector
- AI Dev: RAG integration + Forecasting API
- Full-stack: Auto PO workflow + Marketing integration

---

**Status:** Ready to implement. All specifications complete.
