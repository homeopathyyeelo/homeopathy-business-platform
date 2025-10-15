#!/bin/bash
# Script to generate all API routes for the ERP system

cd /var/www/homeopathy-business-platform

# Create directory structure
mkdir -p app/api/master/{customers,suppliers,categories,brands,units,taxes}
mkdir -p app/api/inventory/{batches,movements,adjustments,valuation}
mkdir -p app/api/sales/{invoices,returns,analytics}
mkdir -p app/api/purchases/{orders,grn,returns}
mkdir -p app/api/reports/{sales,purchase,inventory,gst}
mkdir -p app/api/marketing/{campaigns,whatsapp,sms,email}
mkdir -p app/api/prescriptions
mkdir -p app/api/customers
mkdir -p app/api/suppliers
mkdir -p app/api/dashboard

# Function to create a generic CRUD API route
create_crud_route() {
  local TABLE_NAME=$1
  local ROUTE_PATH=$2
  local ID_PREFIX=$3
  
  cat > "${ROUTE_PATH}/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

const TABLE_NAME = 'TABLE_PLACEHOLDER';
const ID_PREFIX = 'ID_PREFIX_PLACEHOLDER';

// GET all records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    
    const conditions: Record<string, any> = {};
    if (isActive !== null) {
      conditions.is_active = isActive === 'true';
    }
    
    const records = await db.getAll(TABLE_NAME, Object.keys(conditions).length > 0 ? conditions : undefined);
    
    return NextResponse.json(records, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching ${TABLE_NAME}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${TABLE_NAME}`, message: error.message },
      { status: 500 }
    );
  }
}

// POST create new record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newRecord = await db.insert(TABLE_NAME, body);
    
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error(`Error creating ${TABLE_NAME}:`, error);
    return NextResponse.json(
      { error: `Failed to create ${TABLE_NAME}`, message: error.message },
      { status: 500 }
    );
  }
}

// PUT update record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const updatedRecord = await db.update(TABLE_NAME, id, updateData);
    
    return NextResponse.json(updatedRecord, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating ${TABLE_NAME}:`, error);
    return NextResponse.json(
      { error: `Failed to update ${TABLE_NAME}`, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE record
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const deletedRecord = await db.delete(TABLE_NAME, id);
    
    return NextResponse.json(deletedRecord, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting ${TABLE_NAME}:`, error);
    return NextResponse.json(
      { error: `Failed to delete ${TABLE_NAME}`, message: error.message },
      { status: 500 }
    );
  }
}
EOF

  sed -i "s/TABLE_PLACEHOLDER/${TABLE_NAME}/g" "${ROUTE_PATH}/route.ts"
  sed -i "s/ID_PREFIX_PLACEHOLDER/${ID_PREFIX}/g" "${ROUTE_PATH}/route.ts"
}

# Generate routes for master data
create_crud_route "customers" "app/api/master/customers" "CUST"
create_crud_route "suppliers" "app/api/master/suppliers" "SUPP"
create_crud_route "categories" "app/api/master/categories" "CAT"
create_crud_route "brands" "app/api/master/brands" "BRD"
create_crud_route "units" "app/api/master/units" "UNIT"
create_crud_route "tax_rates" "app/api/master/taxes" "TAX"

# Generate routes for inventory
create_crud_route "inventory" "app/api/inventory/batches" "BATCH"
create_crud_route "stock_movements" "app/api/inventory/movements" "MOV"

# Generate routes for sales
create_crud_route "invoices" "app/api/sales/invoices" "INV"
create_crud_route "sales_returns" "app/api/sales/returns" "RET"

# Generate routes for purchases
create_crud_route "purchases" "app/api/purchases/orders" "PO"
create_crud_route "purchase_items" "app/api/purchases/items" "PI"

# Generate routes for prescriptions
create_crud_route "prescriptions" "app/api/prescriptions" "RX"

echo "✅ All API routes generated successfully!"
