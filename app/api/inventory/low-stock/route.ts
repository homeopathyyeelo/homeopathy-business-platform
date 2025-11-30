import { NextRequest, NextResponse } from 'next/server';

const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

const mockLowStock = [
  { id: 1, product: { id: 4, name: 'Pulsatilla 30C' }, quantity: 15, minStock: 30, status: 'CRITICAL' },
  { id: 2, product: { id: 7, name: 'Bryonia 200C' }, quantity: 35, minStock: 50, status: 'LOW_STOCK' }
];

export async function GET() {
  try {
    // Fetch from Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/inventory/low-stock`);
    const data = await res.json();
    
    if (res.ok) {
      return NextResponse.json({ success: true, data: data.data || [], total: data.total || 0 });
    }
  } catch (error) {
    console.error('Low stock API error:', error);
  }
  
  // Fallback to mock data
  return NextResponse.json({ success: true, data: mockLowStock, total: mockLowStock.length });
}
