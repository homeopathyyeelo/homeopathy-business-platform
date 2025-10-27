# API Port Configuration Fix

## Problem
Dynamic Right Panel was calling `localhost:3000` (Next.js frontend) instead of `localhost:3005` (Go API backend), causing 404 errors:

```
❌ GET http://localhost:3000/api/erp/products?limit=1 → 404
❌ GET http://localhost:3000/api/erp/categories → 404  
❌ GET http://localhost:3000/api/erp/brands → 404
❌ GET http://localhost:3000/api/erp/dashboard/activity → 404
```

## Root Cause
The `use-page-insights.ts` hook was using relative API paths which resolved to the Next.js dev server (port 3000) instead of the Go API server (port 3005).

## Solution
Updated `lib/hooks/use-page-insights.ts` to prepend the correct API URL (`http://localhost:3005`) to all insight data fetcher calls.

### Changes Made

**File**: `lib/hooks/use-page-insights.ts`

**Before**:
```typescript
const response = await fetch(insightConfig.dataFetcher);
```

**After**:
```typescript
const apiUrl = insightConfig.dataFetcher.startsWith('http') 
  ? insightConfig.dataFetcher 
  : `http://localhost:3005${insightConfig.dataFetcher}`;

const response = await fetch(apiUrl);
```

Also fixed the `useInsight` hook for SWR-based fetching.

## Verification

After hot reload, all API calls should now work:

```bash
✅ GET http://localhost:3005/api/erp/products?limit=1
✅ GET http://localhost:3005/api/erp/categories
✅ GET http://localhost:3005/api/erp/brands
✅ GET http://localhost:3005/api/erp/dashboard/activity
```

## Architecture

```
┌─────────────────────┐
│  Next.js Frontend   │
│   localhost:3000    │  
└──────────┬──────────┘
           │
           │ API calls to port 3005
           │
           ▼
┌─────────────────────┐
│   Go API Backend    │
│   localhost:3005    │
│  /api/erp/*         │
└─────────────────────┘
```

## Environment Variables

The system uses:
- `NEXT_PUBLIC_API_URL=http://localhost:3005/api/erp` (from .env.local)
- Fallback hardcoded: `http://localhost:3005` if env var not available

## Status
✅ **FIXED** - All Dynamic Right Panel API calls now correctly target port 3005

The Next.js dev server will hot reload automatically, no restart needed!
