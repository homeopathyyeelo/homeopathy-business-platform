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
    
    // Get auth token from request
    const authHeader = request.headers.get('authorization') || request.headers.get('cookie');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    
    if (authHeader) {
      if (authHeader.includes('Bearer ')) {
        headers['Authorization'] = authHeader;
      } else if (authHeader.includes('auth-token=')) {
        const tokenMatch = authHeader.match(/auth-token=([^;]+)/);
        if (tokenMatch) {
          headers['Authorization'] = `Bearer ${tokenMatch[1]}`;
        }
      }
    }
    
    // Fetch from Golang API with auth
    const res = await fetch(`${GOLANG_API_URL}/api/erp/customers?${params.toString()}`, {
      headers
    });
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
    
    // Get auth token from request
    const authHeader = request.headers.get('authorization') || request.headers.get('cookie');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    
    if (authHeader) {
      if (authHeader.includes('Bearer ')) {
        headers['Authorization'] = authHeader;
      } else if (authHeader.includes('auth-token=')) {
        const tokenMatch = authHeader.match(/auth-token=([^;]+)/);
        if (tokenMatch) {
          headers['Authorization'] = `Bearer ${tokenMatch[1]}`;
        }
      }
    }
    
    // Transform frontend data to match backend schema
    const customerData = {
      name: body.name,
      phone: body.phone,
      email: body.email || '',
      address: body.address || '',
      customerType: body.type || 'RETAIL',
      gstNumber: body.gstNumber || '',
      creditLimit: 0,
      isActive: true
    };
    
    // Send to Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(customerData)
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
