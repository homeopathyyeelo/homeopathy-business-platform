# Next.js Frontend - Complete Implementation Plan

## Pages Structure

### Main Navigation Sidebar

1. **Dashboard** - `/dashboard`
2. **Daily Register** - `/daily-register`
3. **Retail POS** - `/pos`
4. **Prescriptions** - `/prescriptions`
5. **Products** - `/products`
6. **Inventory** - `/inventory`
7. **Sales** - `/sales`
8. **Purchases** - `/purchases`
9. **Customers** - `/customers`
10. **HR** - `/hr`
11. **Finance** - `/finance`
12. **Reports** - `/reports`
13. **CRM** - `/crm`
14. **Manufacturing** - `/manufacturing`
15. **Warehouse** - `/warehouse`
16. **Schemes** - `/schemes`
17. **Marketing** - `/marketing`
18. **AI Chat** - `/ai/chat`
19. **Analytics** - `/analytics`
20. **AI Campaigns** - `/ai/campaigns`
21. **AI Insights** - `/ai/insights`
22. **AI Demos** - `/ai/demos`

### Quick Stats (Dashboard Widgets)
- Active Batches: 1,234
- Expiring Soon: 23
- Notifications: 5

### User Menu
- Settings - `/settings`
- User Profile - `/profile`
- Sign Out

## API Integration

### Backend Services to Consume

1. **Golang API** (Port 3004)
   - Products CRUD
   - Customers CRUD
   - Orders CRUD
   - Inventory Management
   - Analytics

2. **Express API** (Port 3003)
   - Campaigns
   - Marketing automation
   - Event streaming

3. **NestJS API** (Port 3001)
   - Complex business logic
   - ERP operations
   - Finance & HR

4. **Python AI Service** (Port 8001)
   - AI Chat
   - AI Campaigns
   - AI Insights
   - Content generation
   - Demand forecasting

5. **GraphQL Gateway** (Port 4000)
   - Unified data queries
   - Real-time subscriptions

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** shadcn/ui + Tailwind CSS
- **State Management:** Zustand / React Query
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** Lucide React
- **Authentication:** NextAuth.js
- **API Client:** Axios / TanStack Query

## File Structure

```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx              # Main layout with sidebar
│   ├── dashboard/
│   ├── daily-register/
│   ├── pos/
│   ├── prescriptions/
│   ├── products/
│   ├── inventory/
│   ├── sales/
│   ├── purchases/
│   ├── customers/
│   ├── hr/
│   ├── finance/
│   ├── reports/
│   ├── crm/
│   ├── manufacturing/
│   ├── warehouse/
│   ├── schemes/
│   ├── marketing/
│   ├── analytics/
│   └── ai/
│       ├── chat/
│       ├── campaigns/
│       ├── insights/
│       └── demos/
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── RevenueChart.tsx
│   │   └── RecentOrders.tsx
│   └── shared/
│       ├── DataTable.tsx
│       ├── SearchBar.tsx
│       └── Pagination.tsx
├── lib/
│   ├── api/
│   │   ├── golang-api.ts
│   │   ├── express-api.ts
│   │   ├── nestjs-api.ts
│   │   ├── python-ai.ts
│   │   └── graphql.ts
│   ├── hooks/
│   ├── utils/
│   └── store/
└── types/
    └── index.ts
```

## Implementation Steps

### Phase 1: Setup & Layout (Day 1)
1. Initialize Next.js 14 with App Router
2. Install dependencies (shadcn/ui, Tailwind, etc.)
3. Create main layout with sidebar
4. Implement authentication
5. Create reusable components

### Phase 2: Core Pages (Days 2-3)
1. Dashboard with stats and charts
2. Products management (CRUD)
3. Customers management
4. Orders/Sales
5. Inventory

### Phase 3: Business Pages (Days 4-5)
1. Daily Register
2. Retail POS
3. Prescriptions
4. Purchases
5. HR & Finance

### Phase 4: Advanced Features (Days 6-7)
1. Reports & Analytics
2. CRM
3. Manufacturing & Warehouse
4. Schemes & Marketing

### Phase 5: AI Features (Days 8-9)
1. AI Chat interface
2. AI Campaigns
3. AI Insights dashboard
4. AI Demos

### Phase 6: Polish & Testing (Day 10)
1. Error handling
2. Loading states
3. Responsive design
4. Testing
5. Performance optimization

## API Integration Pattern

```typescript
// lib/api/golang-api.ts
import axios from 'axios';

const golangAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3004',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
golangAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const productsAPI = {
  getAll: () => golangAPI.get('/api/products'),
  getById: (id: string) => golangAPI.get(`/api/products/${id}`),
  create: (data: any) => golangAPI.post('/api/products', data),
  update: (id: string, data: any) => golangAPI.put(`/api/products/${id}`, data),
  delete: (id: string) => golangAPI.delete(`/api/products/${id}`),
};

export const customersAPI = {
  getAll: () => golangAPI.get('/api/customers'),
  // ... similar pattern
};
```

## Environment Variables

```env
# API URLs
NEXT_PUBLIC_GOLANG_API_URL=http://localhost:3004
NEXT_PUBLIC_EXPRESS_API_URL=http://localhost:3003
NEXT_PUBLIC_NESTJS_API_URL=http://localhost:3001
NEXT_PUBLIC_PYTHON_AI_URL=http://localhost:8001
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
```

## Next Steps

1. Review this plan
2. Confirm page requirements
3. Start implementation
4. Integrate with all backend services
5. Test and deploy
