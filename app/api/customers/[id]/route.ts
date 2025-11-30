import { NextRequest, NextResponse } from 'next/server';

const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id;
    
    // Fetch customer from Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/customers/${customerId}`);
    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Customer not found' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data
    });
  } catch (error: any) {
    console.error('Customer fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id;
    const body = await request.json();
    
    // Update customer via Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to update customer' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Customer updated successfully'
    });
  } catch (error: any) {
    console.error('Customer update error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
