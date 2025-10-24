# Admin AppShell Specification (HomeoERP v2.1.0)

- **layout**
  - top: `components/layout/TopBar.tsx` (branch selector, global search, user menu)
  - left: `components/layout/EnterpriseLeftSidebar.tsx` (collapsible, full menu)
  - right: `components/layout/RightPanel.tsx` (Expiry Alerts, AI Suggestions, Active Bugs)
  - bottom: `components/layout/BottomBar.tsx` (system status, shortcuts)
  - main wrapper: `components/layout/MainERPLayout.tsx`

- **pixel-grid**
  - left width: 280px expanded, 72px collapsed
  - right width: 340px
  - top height: 56px
  - bottom height: 28px
  - dashboard main: 3-column
    - left widgets: 300px fixed
    - center: fluid
    - right panel: 340px

- **menu.json**
  - source file: `ui/menu.json`
  - each node fields: `id`, `label`, `path`, `permission_code`, `icon`
  - roles map: `ui/layout/app_shell_spec.md` (below)

- **rbac mapping (roles → permission codes)**
  - Admin: `PERM_*`
  - Manager:
    - `PERM_DASHBOARD_VIEW`
    - `PERM_PRODUCTS_READ`, `PERM_INVENTORY_READ`, `PERM_INVENTORY_EXPIRE_VIEW`
    - `PERM_SALES_READ`, `PERM_PURCHASE_READ`
    - `PERM_CUSTOMERS_READ`, `PERM_VENDORS_READ`
    - `PERM_FINANCE_READ`, `PERM_REPORTS_VIEW`
    - `PERM_SYS_BUGS_READ`
  - Operator:
    - `PERM_DASHBOARD_VIEW`
    - `PERM_SALES_CREATE`, `PERM_PURCHASE_CREATE`
    - `PERM_INVENTORY_EXPIRE_VIEW`
  - Auditor:
    - `PERM_REPORTS_VIEW`, `PERM_FINANCE_READ`, `PERM_AUDIT_READ`

- **right panel widgets**
  - Expiry Alerts
    - filters: `7d | 1m | 3m | 6m | 1y`
    - list: top 10 batches approaching expiry with `product`, `batch`, `expiry_date`, `qty`
  - AI Suggestions
    - inventory: reorder suggestions, low-stock predictions
    - purchase: vendor optimization
  - Active Bugs
    - top 10 open P0/P1 by service

- **bottom bar**
  - left: service health (colored dots) for `api-core`, `gateway`, `ai`, `campaign`, `kafka`, `postgres`, `minio`
  - center: keyboard shortcuts (`/` search, `g+d` dashboard, `g+i` inventory, `?` help)
  - right: UTC clock, build version, trace id (if present)

- **dashboard wireframe placement**
  - top KPI row: revenue today, invoices, low stock, expiring soon
  - left column (300px): Expiry Summary, Quick Upload (invoice PDF)
  - center: Bug Tracker panel, AI-Fix panel (tabs)
  - right panel: filters + AI chat

- **menu tree**
  - see `ui/menu.json` with 60+ entries covering Products, Inventory, Sales, Purchases, Customers, Vendors, Finance, HR, Reports, Analytics, Marketing, CRM, AI, Settings, System
