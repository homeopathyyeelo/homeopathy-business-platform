#!/bin/bash

echo "🚀 Creating All ERP Pages..."

# Create all missing page directories and basic page.tsx files

# Vendors Module
mkdir -p app/vendors/{types,terms,outstanding,performance}

# Products - Additional
mkdir -p app/products/{pricing,import}

# Inventory - Additional  
mkdir -p app/inventory/{stock,adjustments,transfers}

# Sales - Additional
mkdir -p app/sales/{orders,credit,returns}

# Purchases - Additional
mkdir -p app/purchases/{grn,bills,returns,payments,reorder}

# Customers - Additional
mkdir -p app/customers/{groups,outstanding}

# HR Module
mkdir -p app/hr/{attendance,leave,payroll,performance}

# Finance Module
mkdir -p app/finance/{ledger,cashbook,expenses,pl,balance}

# Reports - Additional
mkdir -p app/reports/{purchase,stock,expiry,gst,custom}

# Marketing - Additional
mkdir -p app/marketing/{whatsapp,sms,segments}

# Social Media Module
mkdir -p app/social/{gmb,instagram,facebook,youtube,wordpress}

# CRM Service Module
mkdir -p app/crm/{tickets,appointments,followups,chat,feedback}

# AI Module - Additional
mkdir -p app/ai/{forecasting,pricing,content}

# Analytics - Additional
mkdir -p app/analytics/{kpi,products,ltv,forecast}

# Delivery Module
mkdir -p app/delivery/{staff,routes,tracking,pod}

# Manufacturing - Additional
mkdir -p app/manufacturing/{bom,orders,quality,materials}

# Settings - Additional
mkdir -p app/settings/{branches,roles,tax,integrations,backup}

# Profile Module
mkdir -p app/profile/{activity,security,preferences}

echo "✅ All directories created!"

# Create basic page template for each
cat > /tmp/page-template.txt << 'TEMPLATE'
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function PAGE_NAME() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">MODULE_TITLE</h2>
          <p className="text-muted-foreground">MODULE_DESCRIPTION</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MODULE_TITLE Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">🚀 Coming Soon</p>
              <p>Full CRUD functionality will be implemented here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
TEMPLATE

echo "✅ Template created!"
echo "📊 Total new pages to create: 63+"
echo "✅ Directory structure ready for full ERP implementation!"
