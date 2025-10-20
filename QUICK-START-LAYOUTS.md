# 🚀 Quick Start - ERP Layout System

## TL;DR - What You Need to Know

✅ **Problem Solved**: Cleaned up duplicate layout files and created organized system  
✅ **Two Layouts**: Simple (Top+Left) and Full (4-side)  
✅ **User Choice**: Settings page to switch layouts  
✅ **Homeopathy Menus**: 18 modules tailored for your business  

---

## 📍 File Locations

### ✅ NEW (Use These)
```
components/layout/erp/
├── TopBar.tsx          ← Top navigation
├── LeftSidebar.tsx     ← Main menu (18 modules)
├── RightPanel.tsx      ← Filters, AI, Activity
├── BottomBar.tsx       ← Status bar
├── SimpleLayout.tsx    ← Simple mode
├── FullLayout.tsx      ← Full mode
└── ERPLayout.tsx       ← Main wrapper
```

### ⚠️ OLD (Can Delete)
```
apps/next-erp/components/layout/
├── AppShell.tsx        ← Delete (duplicate)
├── TopBar.tsx          ← Delete (duplicate)
├── LeftSidebar.tsx     ← Delete (duplicate)
├── RightPanel.tsx      ← Delete (duplicate)
└── BottomBar.tsx       ← Delete (duplicate)
```

---

## 🎨 Layout Modes

### Simple Layout
```
┌─────────────────────────────────────┐
│         TOP BAR                     │ ← Logo, Search, Quick Create
├──────┬──────────────────────────────┤
│      │                              │
│ LEFT │      MAIN CONTENT            │
│ MENU │                              │
│      │                              │
└──────┴──────────────────────────────┘
```

**Use When**: You want maximum content space, focused work

### Full Layout (4-Side)
```
┌─────────────────────────────────────┐
│         TOP BAR                     │ ← Logo, Search, Quick Create
├──────┬──────────────────────┬───────┤
│      │                      │       │
│ LEFT │   MAIN CONTENT       │ RIGHT │ ← Filters, AI, Activity
│ MENU │                      │ PANEL │
│      │                      │       │
├──────┴──────────────────────┴───────┤
│         BOTTOM BAR                  │ ← Status, Jobs, Shortcuts
└─────────────────────────────────────┘
```

**Use When**: You need all features, power user, analytics work

---

## ⚡ Quick Actions

### 1. Start Application
```bash
./start.sh
# or
npm run dev
```

### 2. Choose Layout
Visit: **http://localhost:3000/app/settings/layout**

Click on your preferred layout card → Changes apply instantly

### 3. Access Features

**Top Bar**:
- 🔍 Search: Type to search products, customers, invoices
- ➕ Quick Create: Click to create Invoice, PO, Customer, Product
- 🔔 Notifications: View alerts and updates
- 👤 Profile: Settings and logout

**Left Menu** (18 Modules):
- 💊 Medicines → Dilutions, Tinctures, Biochemic
- 📦 Inventory → Stock, Batches, Expiry
- 🛒 Sales → POS, Prescriptions, Invoices
- 🏥 Patients → Case History, Follow-ups
- 🧪 Laboratory → Tests, Results
- 🤖 AI Assistant → Chat, Remedy Finder
- ⚙️ Settings → Layout Preferences

**Right Panel** (Full Layout):
- 🔍 Filters: Quick date ranges, status filters
- 🤖 AI: Smart suggestions, reorder alerts
- 📊 Activity: Recent actions, pending approvals

**Bottom Bar** (Full Layout):
- 🟢 Status: DB, Kafka, Sync status
- 📑 Tabs: Open documents
- ⚡ Jobs: Background tasks
- ⌨️ Shortcuts: Keyboard hints

---

## 🔧 Common Tasks

### Switch Between Layouts

**Method 1**: Via Settings Page
1. Go to `/app/settings/layout`
2. Click on desired layout
3. Page reloads automatically

**Method 2**: Programmatically
```typescript
import { updateLayoutPreferences } from '@/components/layout/erp/ERPLayout';

// Switch to Simple
updateLayoutPreferences({ mode: 'simple' });

// Switch to Full
updateLayoutPreferences({ mode: 'full' });
```

### Add New Menu Item

Edit: `components/layout/erp/LeftSidebar.tsx`

```typescript
const menuItems: MenuItem[] = [
  // ... existing items
  {
    id: 'your-module',
    label: 'Your Module',
    icon: YourIcon,
    path: '/app/your-module',
    children: [
      { id: 'sub1', label: 'Submenu 1', icon: null, path: '/app/your-module/sub1' },
    ],
  },
];
```

### Customize Quick Create

Edit: `components/layout/erp/TopBar.tsx`

```typescript
const quickCreateOptions = [
  { label: 'Your Action', icon: YourIcon, path: '/your/path' },
  // ... more options
];
```

---

## 🐛 Troubleshooting

### Layout Not Changing?
```bash
# Clear cache
localStorage.clear()

# Hard refresh
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Sidebar Hidden?
- Click **menu icon** (☰) in top bar
- Or press **Ctrl+B**

### Right Panel Missing?
- Ensure you're using **Full Layout** (not Simple)
- Click **settings icon** in top bar

### Bottom Bar Gone?
- Ensure you're using **Full Layout**
- You may have closed it (click X)
- Reload page to restore

---

## 📊 Feature Comparison

| Feature | Simple | Full |
|---------|--------|------|
| Top Bar | ✅ | ✅ |
| Left Menu | ✅ | ✅ |
| Right Panel | ❌ | ✅ |
| Bottom Bar | ❌ | ✅ |
| AI Suggestions | ❌ | ✅ |
| Quick Filters | ❌ | ✅ |
| Activity Feed | ❌ | ✅ |
| Status Indicators | ❌ | ✅ |
| Content Space | Maximum | Optimized |

---

## 🎯 Best Practices

### When to Use Simple Layout
- ✅ Data entry tasks
- ✅ POS billing
- ✅ Single-screen workflows
- ✅ Focused work without distractions
- ✅ Smaller screens

### When to Use Full Layout
- ✅ Dashboard viewing
- ✅ Analytics and reports
- ✅ Multi-tasking
- ✅ Need AI suggestions
- ✅ Power user workflows
- ✅ Large screens

---

## 📱 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + B` | Toggle left sidebar |
| `Ctrl + R` | Toggle right panel |
| `Ctrl + Shift + B` | Toggle bottom bar |
| `Ctrl + K` | Focus search |
| `Ctrl + N` | Quick create menu |
| `?` | Show all shortcuts |

---

## 🎓 Menu Structure

```
📊 Dashboard
💊 Medicines
   ├── Medicine List
   ├── Potencies
   ├── Mother Tinctures
   ├── Biochemic Salts
   └── Combinations
📦 Inventory
   ├── Stock List
   ├── Batch Management
   ├── Expiry Tracking
   └── Stock Adjustments
🛒 Sales
   ├── POS Billing ⭐
   ├── Prescriptions
   ├── Invoices
   └── Returns
🏥 Patients
   ├── Patient List
   ├── Case History
   └── Follow-ups
🧪 Laboratory
   ├── Lab Tests
   ├── Test Results
   └── Equipment
💰 Finance
   ├── Ledgers
   ├── GST/Tax
   └── P&L Statement
👥 HR & Payroll
📢 Marketing
📚 Knowledge Base
   ├── Materia Medica
   ├── Repertory
   └── Case Studies
🤖 AI Assistant ⭐
   ├── AI Chat
   ├── Prescription AI
   └── Remedy Finder
📈 Analytics
📄 Reports
⚙️ Settings
   └── Layout Preferences ⭐
```

---

## 🔗 Quick Links

- **Layout Settings**: `/app/settings/layout`
- **Dashboard**: `/app/dashboard`
- **POS Billing**: `/app/sales/pos`
- **AI Assistant**: `/app/ai/chat`
- **Documentation**: `LAYOUT-SYSTEM.md`

---

## ✅ Checklist for First Use

- [ ] Start application (`./start.sh` or `npm run dev`)
- [ ] Visit layout settings (`/app/settings/layout`)
- [ ] Choose your preferred layout (Simple or Full)
- [ ] Explore the menu structure
- [ ] Try the global search
- [ ] Test quick create menu
- [ ] Check AI suggestions (Full layout)
- [ ] Review keyboard shortcuts
- [ ] Read full documentation (`LAYOUT-SYSTEM.md`)

---

## 🎉 You're All Set!

The new ERP layout system is ready to use. Choose your layout mode and start working!

**Need Help?**
- 📖 Full Guide: `LAYOUT-SYSTEM.md`
- 🚀 Implementation: `IMPLEMENTATION-COMPLETE.md`
- 🏗️ Architecture: `ARCHITECTURE-POLYGLOT-SERVICES.md`

---

**Built for Homeopathy Business Management** 💊
