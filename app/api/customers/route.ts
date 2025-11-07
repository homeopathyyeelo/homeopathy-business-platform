import { NextRequest, NextResponse } from 'next/server';

// Mock customers data
const mockCustomers = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '9876543310',
    address: '123 MG Road, Mumbai, Maharashtra',
    type: 'RETAIL',
    totalPurchases: 25000,
    outstandingAmount: 0,
    loyaltyPoints: 250,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '9876543311',
    address: '456 Park Street, Delhi',
    type: 'RETAIL',
    totalPurchases: 18000,
    outstandingAmount: 2000,
    loyaltyPoints: 180,
    createdAt: '2024-02-20T11:00:00Z'
  },
  {
    id: 3,
    name: 'Amit Patel',
    email: 'amit.patel@email.com',
    phone: '9876543312',
    address: '789 Station Road, Ahmedabad, Gujarat',
    type: 'WHOLESALE',
    totalPurchases: 150000,
    outstandingAmount: 15000,
    loyaltyPoints: 1500,
    createdAt: '2024-03-10T09:00:00Z'
  },
  {
    id: 4,
    name: 'Dr. Sunita Verma',
    email: 'dr.sunita@clinic.com',
    phone: '9876543313',
    address: '321 Medical Complex, Pune, Maharashtra',
    type: 'DOCTOR',
    totalPurchases: 85000,
    outstandingAmount: 5000,
    loyaltyPoints: 850,
    createdAt: '2024-04-05T14:00:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    
    let filtered = mockCustomers;
    
    if (type && type !== 'ALL') {
      filtered = filtered.filter(c => c.type === type);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(searchLower)
      );
    }

    const summary = {
      total: filtered.length,
      retail: filtered.filter(c => c.type === 'RETAIL').length,
      wholesale: filtered.filter(c => c.type === 'WHOLESALE').length,
      doctor: filtered.filter(c => c.type === 'DOCTOR').length,
      totalOutstanding: filtered.reduce((sum, c) => sum + c.outstandingAmount, 0)
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
    
    const newCustomer = {
      id: mockCustomers.length + 1,
      ...body,
      totalPurchases: 0,
      outstandingAmount: 0,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString()
    };

    mockCustomers.push(newCustomer);

    return NextResponse.json({
      success: true,
      data: newCustomer,
      message: 'Customer created successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
