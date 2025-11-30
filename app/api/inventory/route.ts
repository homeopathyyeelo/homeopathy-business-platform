import { NextRequest, NextResponse } from 'next/server';

const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

// Mock inventory data (fallback only)
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
    const limit = searchParams.get('limit') || '100';
    
    // Build query params
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    params.append('limit', limit);
    
    // Fetch from Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/inventory?${params.toString()}`);
    const data = await res.json();
    
    if (!res.ok) {
      console.warn('Golang API failed, using mock data');
      // Fallback to mock if API fails
      let filtered = mockInventory;
      if (status && status !== 'ALL') {
        filtered = mockInventory.filter(i => i.status === status);
      }
      return NextResponse.json({
        success: true,
        data: filtered,
        summary: { total: filtered.length }
      });
    }

    return NextResponse.json({
      success: true,
      data: data.data?.items || data.data || [],
      summary: {
        total: data.data?.total || 0,
        inStock: 0,
        lowStock: 0,
        critical: 0,
        totalValue: 0
      }
    });
  } catch (error: any) {
    console.error('Inventory API error:', error);
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
