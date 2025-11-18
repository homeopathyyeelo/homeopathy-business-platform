#!/usr/bin/env ts-node
/**
 * AI-Powered Module Generator CLI
 * Usage: npm run generate-modules
 * 
 * This will:
 * 1. Read your menu structure
 * 2. Use OpenAI to generate complete modules for each menu item
 * 3. Create frontend pages, API routes, Go handlers, and migrations
 */

import { generateAllModules, generateModule } from '../lib/ai/module-generator';
import * as fs from 'fs';
import * as path from 'path';

// Define your menu structure
// You can paste the actual menu JSON here or load from a file
const menuStructure = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    label: 'Products',
    icon: 'Package',
    children: [
      { label: 'Product List', href: '/products', description: 'View and manage all products' },
      { label: 'Add Product', href: '/products/add', description: 'Add new product' },
      { label: 'Categories', href: '/categories', description: 'Manage product categories' },
      { label: 'Brands', href: '/brands', description: 'Manage product brands' },
      { label: 'Potencies', href: '/potencies', description: 'Manage potency levels' },
      { label: 'Forms', href: '/forms', description: 'Manage product forms (tablet, liquid, etc)' },
      { label: 'Units', href: '/units', description: 'Manage units of measurement' },
      { label: 'HSN Codes', href: '/hsn-codes', description: 'Manage HSN/SAC codes' },
    ]
  },
  {
    label: 'Inventory',
    icon: 'Warehouse',
    children: [
      { label: 'Stock Overview', href: '/inventory/stock', description: 'View current stock levels' },
      { label: 'Stock Adjustments', href: '/inventory/adjustments', description: 'Adjust stock quantities' },
      { label: 'Stock Transfer', href: '/inventory/transfer', description: 'Transfer stock between locations' },
      { label: 'Low Stock Alerts', href: '/inventory/alerts', description: 'Products below minimum stock' },
      { label: 'Expiry Alerts', href: '/inventory/expiry', description: 'Products nearing expiry' },
      { label: 'Stock Valuation', href: '/inventory/valuation', description: 'Current stock value' },
      { label: 'Stock Report', href: '/inventory/reports', description: 'Detailed stock reports' },
    ]
  },
  {
    label: 'Sales',
    icon: 'ShoppingCart',
    children: [
      { label: 'Sales Orders', href: '/sales/orders', description: 'View all sales orders' },
      { label: 'Create Order', href: '/sales/orders/create', description: 'Create new sales order' },
      { label: 'Invoices', href: '/sales/invoices', description: 'Sales invoices' },
      { label: 'Quotations', href: '/sales/quotations', description: 'Sales quotations' },
      { label: 'Returns', href: '/sales/returns', description: 'Sales returns' },
      { label: 'POS', href: '/pos', description: 'Point of Sale' },
    ]
  },
  {
    label: 'Purchase',
    icon: 'TruckIcon',
    children: [
      { label: 'Purchase Orders', href: '/purchases/orders', description: 'View all purchase orders' },
      { label: 'Create PO', href: '/purchases/orders/create', description: 'Create new purchase order' },
      { label: 'Upload Purchase', href: '/purchases/upload', description: 'Bulk upload purchases' },
      { label: 'Receipts', href: '/purchases/receipts', description: 'Goods received notes' },
      { label: 'Returns', href: '/purchases/returns', description: 'Purchase returns' },
      { label: 'Vendors', href: '/vendors', description: 'Manage vendors' },
    ]
  },
  {
    label: 'Customers',
    icon: 'Users',
    children: [
      { label: 'Customer List', href: '/customers', description: 'View all customers' },
      { label: 'Add Customer', href: '/customers/add', description: 'Add new customer' },
      { label: 'Customer Groups', href: '/customers/groups', description: 'Manage customer groups' },
      { label: 'Loyalty Program', href: '/customers/loyalty', description: 'Customer loyalty points' },
      { label: 'Credit Management', href: '/customers/credit', description: 'Customer credit limits' },
    ]
  },
  {
    label: 'Finance',
    icon: 'DollarSign',
    children: [
      { label: 'Accounts', href: '/finance/accounts', description: 'Chart of accounts' },
      { label: 'Payments', href: '/finance/payments', description: 'Payment transactions' },
      { label: 'Expenses', href: '/finance/expenses', description: 'Business expenses' },
      { label: 'Reports', href: '/finance/reports', description: 'Financial reports' },
      { label: 'Tax Reports', href: '/finance/tax', description: 'GST/Tax reports' },
    ]
  },
  {
    label: 'Reports',
    icon: 'BarChart',
    children: [
      { label: 'Sales Report', href: '/reports/sales', description: 'Sales analytics' },
      { label: 'Purchase Report', href: '/reports/purchases', description: 'Purchase analytics' },
      { label: 'Profit & Loss', href: '/reports/pl', description: 'P&L statement' },
      { label: 'Inventory Report', href: '/reports/inventory', description: 'Stock analytics' },
      { label: 'Customer Report', href: '/reports/customers', description: 'Customer analytics' },
      { label: 'Vendor Report', href: '/reports/vendors', description: 'Vendor analytics' },
    ]
  },
  {
    label: 'Settings',
    icon: 'Settings',
    children: [
      { label: 'Company Profile', href: '/settings/company', description: 'Company details' },
      { label: 'Branches', href: '/settings/branches', description: 'Manage branches' },
      { label: 'Users', href: '/settings/users', description: 'User management' },
      { label: 'Roles & Permissions', href: '/settings/roles', description: 'RBAC setup' },
      { label: 'Tax Settings', href: '/settings/tax', description: 'Tax configuration' },
      { label: 'Payment Methods', href: '/settings/payment-methods', description: 'Configure payment methods' },
      { label: 'Integrations', href: '/settings/integrations', description: 'Third-party integrations' },
      { label: 'Backup & Restore', href: '/settings/backup', description: 'Data backup' },
    ]
  },
  {
    label: 'Admin',
    icon: 'Shield',
    children: [
      { label: 'Approvals', href: '/admin/approvals', description: 'Pending approvals' },
      { label: 'Audit Logs', href: '/admin/audit', description: 'System audit trail' },
      { label: 'System Health', href: '/admin/health', description: 'System status' },
      { label: 'Notifications', href: '/admin/notifications', description: 'System notifications' },
    ]
  },
];

async function main() {
  console.log('🚀 Yeelo Homeopathy ERP - AI Module Generator');
  console.log('================================================\n');
  
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'all') {
    console.log('📦 Generating ALL modules from menu structure...\n');
    await generateAllModules(menuStructure);
  } else if (command === 'module') {
    const moduleName = args[1];
    if (!moduleName) {
      console.error('❌ Please specify a module name');
      console.log('Usage: npm run generate-modules module <name>');
      process.exit(1);
    }
    
    console.log(`📦 Generating module: ${moduleName}\n`);
    
    // Find module in menu structure
    let found = false;
    for (const section of menuStructure) {
      if (section.children) {
        const item = section.children.find(
          (child: any) => child.href === `/${moduleName}` || child.label.toLowerCase() === moduleName.toLowerCase()
        );
        if (item) {
          const spec = {
            name: moduleName,
            displayName: item.label,
            description: item.description,
            fields: [],
            features: ['CRUD', 'Search', 'Filter', 'Export'],
          };
          await generateModule(spec);
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      console.error(`❌ Module "${moduleName}" not found in menu structure`);
      process.exit(1);
    }
  } else {
    console.log('Available commands:');
    console.log('  npm run generate-modules all          # Generate all modules');
    console.log('  npm run generate-modules module <name> # Generate specific module');
    console.log('\nExample:');
    console.log('  npm run generate-modules module vendors');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
