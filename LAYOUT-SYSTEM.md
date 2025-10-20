# ERP Layout System - Complete Guide

## Overview

The Homeopathy ERP platform now has a **clean, organized layout system** with:

1. **Two Layout Modes**: Simple (Top + Left) and Full (4-side)
2. **Reusable Components**: Top, Left, Right, Bottom bars
3. **User Customization**: Settings page to switch layouts
4. **Homeopathy-Specific Menus**: Tailored for homeopathy business

---

## 📁 File Structure

```
components/layout/erp/          # New ERP layout components
├── TopBar.tsx                  # Top navigation bar
├── LeftSidebar.tsx             # Left sidebar with homeopathy menus
├── RightPanel.tsx              # Right contextual panel (Filters, AI, Activity)
├── BottomBar.tsx               # Bottom status bar
├── SimpleLayout.tsx            # Simple layout (Top + Left only)
├── FullLayout.tsx              # Full 4-side layout
└── ERPLayout.tsx               # Main wrapper (switches between Simple/Full)

components/layout/              # Old layouts (kept for backward compatibility)
├── DynamicLayout.tsx           # Updated to use ERPLayout by default
├── EcommerceMegaMenu.tsx       # Old e-commerce layout
├── ThreePanelLayout.tsx        # Old 3-panel layout
└── ProductionERPLayout.tsx     # Wrapper for DynamicLayout

app/(dashboard)/app/settings/layout/
└── page.tsx                    # Layout settings page
```

---

## 🎨 Layout Modes

### 1. Simple Layout (Top + Left)
**File**: `components/layout/erp/SimpleLayout.tsx`

**Features**:
- Top navigation bar
- Left sidebar menu
- Maximum content space
- Minimal distractions
- Perfect for focused work

**Use Case**: Users who want a clean, distraction-free interface

### 2. Full Layout (4-Side)
**File**: `components/layout/erp/FullLayout.tsx`

**Features**:
- Top navigation bar
- Left sidebar menu
- Right contextual panel (Filters, AI suggestions, Activity)
- Bottom status bar (System status, open tabs, shortcuts)
- Maximum productivity

**Use Case**: Power users who need all features at their fingertips

---

## 🧩 Component Breakdown

### TopBar (`TopBar.tsx`)
**Location**: Top of screen (always visible)

**Features**:
- Logo & branding
- Branch/shop selector
- Global search (products, customers, invoices, batches)
- Quick create menu (Invoice, PO, Customer, Product)
- Notifications with badge counter
- Messages / AI Assistant button
- Language selector
- Theme toggle (light/dark)
- User profile menu with logout

**Props**:
```typescript
interface TopBarProps {
  onToggleLeftSidebar?: () => void;
  onToggleRightPanel?: () => void;
  showRightPanelToggle?: boolean;
}
```

---

### LeftSidebar (`LeftSidebar.tsx`)
**Location**: Left side (collapsible)

**Features**:
- Hierarchical navigation menu
- Search within menu
- Module icons with badges
- Expandable submenus
- Active route highlighting
- Responsive (drawer on mobile)

**Homeopathy-Specific Menus**:
1. **Dashboard**
2. **Medicines** - Dilutions, Tinctures, Biochemic, Combinations, Potencies
3. **Inventory** - Stock, Batches, Expiry, Adjustments, Transfers
4. **Sales** - POS, Prescriptions, Orders, Invoices, Returns
5. **Purchases** - PO, GRN, Invoices, Returns, Vendor Pricing
6. **Patients** - List, Case History, Follow-ups, Groups
7. **Customers** - List, Groups, Loyalty
8. **Vendors** - List, Performance, Payments
9. **Manufacturing** - Formulations, Production, Raw Materials, QC
10. **Laboratory** - Tests, Results, Equipment, Reagents
11. **Finance** - Ledgers, GST, E-Way Bills, P&L, Balance Sheet
12. **HR & Payroll** - Employees, Attendance, Payroll, Shifts
13. **Marketing** - Campaigns, Templates, Bulk Send, Email, SMS
14. **Knowledge Base** - Materia Medica, Repertory, Case Studies
15. **AI Assistant** - Chat, Prescription AI, Remedy Finder, Insights
16. **Analytics** - KPIs, Sales, Inventory, Patient, Financial
17. **Reports** - Sales, Purchase, Inventory, Finance, Custom
18. **Settings** - Company, Branches, Users, Roles, Layout, Integrations

**Props**:
```typescript
interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
```

---

### RightPanel (`RightPanel.tsx`)
**Location**: Right side (collapsible, only in Full layout)

**Features**:
- **Filters Tab**: Quick filters, date ranges, status, categories
- **AI Tab**: AI suggestions, reorder recommendations, campaign ideas
- **Activity Tab**: Recent activity feed, pending approvals

**Props**:
```typescript
interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
```

---

### BottomBar (`BottomBar.tsx`)
**Location**: Bottom of screen (closeable, only in Full layout)

**Features**:
- System status indicators (Online, DB, Kafka, Last Sync)
- Open tabs/documents
- Background jobs counter
- Pending approvals
- Current user & role badge
- Keyboard shortcuts hint
- Version & environment

**Props**:
```typescript
interface BottomBarProps {
  onClose: () => void;
}
```

---

## ⚙️ How to Use

### For Users

1. **Access Layout Settings**:
   - Navigate to: `/app/settings/layout`
   - Or: Settings → Layout Preferences

2. **Choose Layout Mode**:
   - **Simple Layout**: Click on "Simple Layout" card
   - **Full Layout**: Click on "Full Layout (4-Side)" card
   - Changes apply immediately (page reloads)

3. **Additional Settings**:
   - Remember sidebar state
   - Show keyboard shortcuts
   - Compact mode

### For Developers

#### Using ERPLayout in Your App

```typescript
// app/layout.tsx
import ERPLayout from '@/components/layout/erp/ERPLayout';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ERPLayout>{children}</ERPLayout>
      </body>
    </html>
  );
}
```

#### Programmatically Change Layout

```typescript
import { updateLayoutPreferences } from '@/components/layout/erp/ERPLayout';

// Switch to Simple layout
updateLayoutPreferences({ mode: 'simple' });

// Switch to Full layout
updateLayoutPreferences({ mode: 'full' });
```

#### Access Layout Preferences

```typescript
// Get current preferences
const saved = localStorage.getItem('erp-layout-preferences');
const preferences = saved ? JSON.parse(saved) : { mode: 'full' };

console.log(preferences.mode); // 'simple' or 'full'
```

---

## 🔧 Customization

### Adding New Menu Items

Edit `components/layout/erp/LeftSidebar.tsx`:

```typescript
const menuItems: MenuItem[] = [
  // ... existing items
  {
    id: 'new-module',
    label: 'New Module',
    icon: YourIcon,
    path: '/app/new-module',
    children: [
      { id: 'sub1', label: 'Submenu 1', icon: null, path: '/app/new-module/sub1' },
      { id: 'sub2', label: 'Submenu 2', icon: null, path: '/app/new-module/sub2' },
    ],
  },
];
```

### Customizing TopBar Quick Create

Edit `components/layout/erp/TopBar.tsx`:

```typescript
const quickCreateOptions = [
  { label: 'Your Action', icon: YourIcon, path: '/your/path' },
  // ... more options
];
```

### Adding AI Suggestions

Edit `components/layout/erp/RightPanel.tsx` in the `AITab` component:

```typescript
<div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
  <div className="flex items-start gap-2">
    <YourIcon className="h-4 w-4 text-blue-600" />
    <div>
      <p className="text-sm font-medium">Your Suggestion</p>
      <p className="text-xs text-blue-700">Your description</p>
      <button className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded">
        Action
      </button>
    </div>
  </div>
</div>
```

---

## 🎯 Best Practices

### 1. Layout Selection
- **Simple Layout**: For data entry, focused tasks, single-screen workflows
- **Full Layout**: For dashboard views, analytics, multi-tasking

### 2. Menu Organization
- Keep menu depth to 2 levels maximum
- Group related items together
- Use badges for important/new features
- Add icons for better visual recognition

### 3. Performance
- Lazy load heavy components
- Use React.memo for static components
- Implement virtual scrolling for long lists

### 4. Accessibility
- Keyboard shortcuts for all major actions
- ARIA labels for screen readers
- Focus management for modals/dropdowns
- High contrast mode support

---

## 🚀 Migration Guide

### From Old Layouts to New ERP Layout

**Step 1**: Update your main layout file

```typescript
// Before
import ProductionERPLayout from '@/components/layout/ProductionERPLayout';

export default function RootLayout({ children }) {
  return <ProductionERPLayout>{children}</ProductionERPLayout>;
}

// After
import ERPLayout from '@/components/layout/erp/ERPLayout';

export default function RootLayout({ children }) {
  return <ERPLayout>{children}</ERPLayout>;
}
```

**Step 2**: Update route paths if needed

The new menu structure uses `/app/*` paths. Update your routes accordingly.

**Step 3**: Test all pages

Ensure all pages render correctly in both Simple and Full layouts.

---

## 🐛 Troubleshooting

### Layout Not Switching
**Problem**: Layout doesn't change when clicking options

**Solution**:
1. Check browser console for errors
2. Clear localStorage: `localStorage.removeItem('erp-layout-preferences')`
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Sidebar Not Showing
**Problem**: Left sidebar is hidden

**Solution**:
1. Check if sidebar is collapsed (click menu icon in top bar)
2. Verify `isOpen` state in component
3. Check CSS classes for `translate-x` values

### Right Panel Missing
**Problem**: Right panel doesn't appear

**Solution**:
1. Ensure you're using **Full Layout** (not Simple)
2. Check `rightPanelOpen` state
3. Click the settings icon in top bar to toggle

### Bottom Bar Not Visible
**Problem**: Bottom bar is missing

**Solution**:
1. Ensure you're using **Full Layout**
2. Check `bottomBarVisible` state
3. Look for close button (X) - you may have closed it

---

## 📊 Layout Comparison

| Feature | Simple Layout | Full Layout |
|---------|--------------|-------------|
| Top Bar | ✅ | ✅ |
| Left Sidebar | ✅ | ✅ |
| Right Panel | ❌ | ✅ |
| Bottom Bar | ❌ | ✅ |
| Content Space | Maximum | Optimized |
| AI Suggestions | ❌ | ✅ |
| Activity Feed | ❌ | ✅ |
| Quick Filters | ❌ | ✅ |
| Status Indicators | ❌ | ✅ |
| Best For | Data Entry | Power Users |

---

## 🔮 Future Enhancements

### Planned Features
1. **Customizable Panels**: Drag & drop to rearrange
2. **Widget System**: Add custom widgets to panels
3. **Saved Workspaces**: Save and switch between different layouts
4. **Keyboard Shortcuts**: Full keyboard navigation
5. **Mobile Optimization**: Touch-friendly mobile layouts
6. **Theme Customization**: Custom color schemes
7. **Panel Resizing**: Adjustable panel widths
8. **Multi-Monitor Support**: Detach panels to separate windows

---

## 📝 Summary

✅ **Clean, organized layout system** with reusable components  
✅ **Two layout modes** (Simple & Full) for different use cases  
✅ **Homeopathy-specific menus** with 18 major modules  
✅ **User customization** via settings page  
✅ **Backward compatible** with old layouts  
✅ **Mobile responsive** with drawer navigation  
✅ **Dark mode support** throughout  
✅ **Professional ERP experience** matching enterprise standards  

---

## 🤝 Support

For questions or issues:
1. Check this documentation
2. Review component source code
3. Check browser console for errors
4. Contact development team

---

**Built with ❤️ for Homeopathy Business Management**
