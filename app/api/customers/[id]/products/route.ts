import { NextRequest, NextResponse } from 'next/server';

const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    
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
    
    // Fetch customer product purchase history from Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/customers/${customerId}/products?limit=${limit}`, {
      headers
    });
    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch products' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data || []
    });
  } catch (error: any) {
    console.error('Customer products fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
