import { NextRequest, NextResponse } from 'next/server';

// Mock data for sales
const mockSales = [
  {
    id: 1,
    invoiceNumber: 'INV-2025-001',
    customer: { id: 1, name: 'Rajesh Kumar', phone: '9876543210' },
    totalAmount: 2500,
    status: 'PAID',
    paymentMethod: 'CASH',
    createdAt: '2025-01-20T10:30:00Z',
    items: [
      { id: 1, product: 'Arnica Montana 30C', quantity: 5, price: 500 }
    ]
  },
  {
    id: 2,
    invoiceNumber: 'INV-2025-002',
    customer: { id: 2, name: 'Priya Sharma', phone: '9876543211' },
    totalAmount: 3200,
    status: 'PAID',
    paymentMethod: 'UPI',
    createdAt: '2025-01-20T11:15:00Z',
    items: [
      { id: 2, product: 'Belladonna 200C', quantity: 8, price: 400 }
    ]
  },
  {
    id: 3,
    invoiceNumber: 'INV-2025-003',
    customer: { id: 3, name: 'Amit Patel', phone: '9876543212' },
    totalAmount: 1800,
    status: 'PENDING',
    paymentMethod: 'CREDIT',
    createdAt: '2025-01-20T12:00:00Z',
    items: [
      { id: 3, product: 'Nux Vomica 1M', quantity: 6, price: 300 }
    ]
  },
  {
    id: 4,
    invoiceNumber: 'INV-2025-004',
    customer: { id: 4, name: 'Sunita Verma', phone: '9876543213' },
    totalAmount: 4500,
    status: 'PAID',
    paymentMethod: 'CARD',
    createdAt: '2025-01-20T14:30:00Z',
    items: [
      { id: 4, product: 'Pulsatilla 30C', quantity: 10, price: 450 }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    
    let filtered = mockSales;
    
    if (status && status !== 'ALL') {
      filtered = filtered.filter(s => s.status === status);
    }
    
    if (date) {
      filtered = filtered.filter(s => s.createdAt.startsWith(date));
    }

    // Calculate totals
    const totalSales = filtered.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPaid = filtered.filter(s => s.status === 'PAID')
      .reduce((sum, sale) => sum + sale.totalAmount, 0);

    return NextResponse.json({
      success: true,
      data: filtered,
      summary: {
        total: filtered.length,
        totalSales,
        totalPaid,
        totalPending: totalSales - totalPaid
      }
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
    
    const newSale = {
      id: mockSales.length + 1,
      invoiceNumber: `INV-2025-${String(mockSales.length + 1).padStart(3, '0')}`,
      ...body,
      createdAt: new Date().toISOString(),
      status: body.paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID'
    };

    mockSales.push(newSale);

    return NextResponse.json({
      success: true,
      data: newSale,
      message: 'Sale created successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
