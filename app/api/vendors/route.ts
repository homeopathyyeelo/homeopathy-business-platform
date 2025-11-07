import { NextRequest, NextResponse } from 'next/server';

// Mock vendors data
const mockVendors = [
  {
    id: 1,
    name: 'SBL Pharmaceuticals',
    email: 'contact@sbl.com',
    phone: '022-12345678',
    address: 'SBL House, Mumbai, Maharashtra',
    gstNumber: 'GST123456789',
    totalPurchases: 500000,
    outstandingAmount: 25000,
    rating: 4.5,
    status: 'ACTIVE'
  },
  {
    id: 2,
    name: 'Dr. Reckeweg & Co',
    email: 'info@reckeweg.com',
    phone: '011-98765433',
    address: 'Reckeweg Plaza, Delhi',
    gstNumber: 'GST987654331',
    totalPurchases: 750000,
    outstandingAmount: 0,
    rating: 4.8,
    status: 'ACTIVE'
  },
  {
    id: 3,
    name: 'Allen Homoeo',
    email: 'sales@allen.com',
    phone: '033-55667788',
    address: 'Allen Complex, Kolkata',
    gstNumber: 'GST456789123',
    totalPurchases: 350000,
    outstandingAmount: 15000,
    rating: 4.2,
    status: 'ACTIVE'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let filtered = mockVendors;
    if (status && status !== 'ALL') {
      filtered = mockVendors.filter(v => v.status === status);
    }

    const summary = {
      total: filtered.length,
      active: filtered.filter(v => v.status === 'ACTIVE').length,
      totalPurchases: filtered.reduce((sum, v) => sum + v.totalPurchases, 0),
      totalOutstanding: filtered.reduce((sum, v) => sum + v.outstandingAmount, 0)
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
    
    const newVendor = {
      id: mockVendors.length + 1,
      ...body,
      totalPurchases: 0,
      outstandingAmount: 0,
      rating: 0,
      status: 'ACTIVE'
    };

    mockVendors.push(newVendor);

    return NextResponse.json({
      success: true,
      data: newVendor,
      message: 'Vendor created successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
