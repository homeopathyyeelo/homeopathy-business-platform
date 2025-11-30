import { NextRequest, NextResponse } from 'next/server';

const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

// Mock vendors data (fallback only)
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
    const limit = searchParams.get('limit') || '100';
    
    // Build query params
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('is_active', status === 'ACTIVE' ? 'true' : 'false');
    params.append('limit', limit);
    
    // Fetch from Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/vendors?${params.toString()}`);
    const data = await res.json();
    
    if (!res.ok) {
      console.warn('Golang API failed, using mock data');
      let filtered = mockVendors;
      if (status && status !== 'ALL') {
        filtered = mockVendors.filter(v => v.status === status);
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
        active: 0,
        totalPurchases: 0,
        totalOutstanding: 0
      }
    });
  } catch (error: any) {
    console.error('Vendors API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Send to Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create vendor');
    }
    
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
