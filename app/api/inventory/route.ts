import { NextRequest, NextResponse } from 'next/server';

// Mock inventory data
const mockInventory = [
  {
    id: 1,
    product: { id: 1, name: 'Arnica Montana 30C', sku: 'ARM-30C-001' },
    quantity: 250,
    minStock: 50,
    maxStock: 500,
    batch: 'BATCH-2024-001',
    expiryDate: '2026-12-31',
    location: 'Shelf A-1',
    status: 'IN_STOCK'
  },
  {
    id: 2,
    product: { id: 2, name: 'Belladonna 200C', sku: 'BEL-200C-002' },
    quantity: 45,
    minStock: 50,
    maxStock: 400,
    batch: 'BATCH-2024-002',
    expiryDate: '2026-11-30',
    location: 'Shelf A-2',
    status: 'LOW_STOCK'
  },
  {
    id: 3,
    product: { id: 3, name: 'Nux Vomica 1M', sku: 'NUX-1M-003' },
    quantity: 180,
    minStock: 40,
    maxStock: 300,
    batch: 'BATCH-2024-003',
    expiryDate: '2025-06-30',
    location: 'Shelf B-1',
    status: 'IN_STOCK'
  },
  {
    id: 4,
    product: { id: 4, name: 'Pulsatilla 30C', sku: 'PUL-30C-004' },
    quantity: 15,
    minStock: 30,
    maxStock: 250,
    batch: 'BATCH-2024-004',
    expiryDate: '2025-03-31',
    location: 'Shelf B-2',
    status: 'CRITICAL'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let filtered = mockInventory;
    if (status && status !== 'ALL') {
      filtered = mockInventory.filter(i => i.status === status);
    }

    // Calculate summary
    const summary = {
      total: filtered.length,
      inStock: filtered.filter(i => i.status === 'IN_STOCK').length,
      lowStock: filtered.filter(i => i.status === 'LOW_STOCK').length,
      critical: filtered.filter(i => i.status === 'CRITICAL').length,
      totalValue: filtered.reduce((sum, item) => sum + (item.quantity * 100), 0)
    };

    return NextResponse.json({
      success: true,
      data: filtered,
      summary
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newItem = {
      id: mockInventory.length + 1,
      ...body,
      status: body.quantity > body.minStock ? 'IN_STOCK' : 'LOW_STOCK'
    };

    mockInventory.push(newItem);

    return NextResponse.json({
      success: true,
      data: newItem,
      message: 'Inventory item added successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
