import { NextRequest, NextResponse } from 'next/server';

const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '100';
    
    // Build query params
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type && type !== 'ALL') params.append('customer_type', type);
    params.append('limit', limit);
    
    // Fetch from Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/customers?${params.toString()}`);
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch customers');
    }

    return NextResponse.json({
      success: true,
      data: data.data?.items || data.data || [],
      summary: {
        total: data.data?.total || 0,
        retail: 0,
        wholesale: 0,
        doctor: 0,
        totalOutstanding: 0
      }
    });
  } catch (error: any) {
    console.error('Customers API error:', error);
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
    const res = await fetch(`${GOLANG_API_URL}/api/erp/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create customer');
    }

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Customer created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
