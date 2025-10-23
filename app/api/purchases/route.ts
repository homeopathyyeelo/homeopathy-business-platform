import { NextRequest, NextResponse } from 'next/server';

// Mock data for purchases
const mockPurchases = [
  {
    id: 1,
    poNumber: 'PO-2025-001',
    vendor: { id: 1, name: 'SBL Pharmaceuticals' },
    totalAmount: 15000,
    status: 'PENDING',
    createdAt: '2025-01-15T10:00:00Z',
    items: [
      { id: 1, product: 'Arnica Montana 30C', quantity: 100, price: 150 }
    ]
  },
  {
    id: 2,
    poNumber: 'PO-2025-002',
    vendor: { id: 2, name: 'Dr. Reckeweg & Co' },
    totalAmount: 25000,
    status: 'APPROVED',
    createdAt: '2025-01-16T11:00:00Z',
    items: [
      { id: 2, product: 'Belladonna 200C', quantity: 200, price: 125 }
    ]
  },
  {
    id: 3,
    poNumber: 'PO-2025-003',
    vendor: { id: 3, name: 'Allen Homoeo' },
    totalAmount: 18000,
    status: 'RECEIVED',
    createdAt: '2025-01-17T09:00:00Z',
    items: [
      { id: 3, product: 'Nux Vomica 1M', quantity: 150, price: 120 }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let filtered = mockPurchases;
    if (status && status !== 'ALL') {
      filtered = mockPurchases.filter(p => p.status === status);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length
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
    
    const newPurchase = {
      id: mockPurchases.length + 1,
      poNumber: `PO-2025-${String(mockPurchases.length + 1).padStart(3, '0')}`,
      ...body,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };

    mockPurchases.push(newPurchase);

    return NextResponse.json({
      success: true,
      data: newPurchase,
      message: 'Purchase order created successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
