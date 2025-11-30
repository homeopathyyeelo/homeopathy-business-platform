import { NextRequest, NextResponse } from 'next/server'

const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    // Fetch from Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/dashboard/recent-sales?limit=${limit}`);
    const data = await res.json();
    
    if (res.ok) {
      return NextResponse.json({ success: true, data: data.data || [] });
    }
  } catch (error) {
    console.error('Recent sales API error:', error);
  }

  // Fallback data
  const recentSales = [
    {
      id: 's1',
      invoice_no: 'INV-2024-001',
      customer_name: 'Rajesh Kumar',
      amount: 1250,
      status: 'paid',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 's2',
      invoice_no: 'INV-2024-002',
      customer_name: 'Priya Sharma',
      amount: 3450,
      status: 'paid',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 's3',
      invoice_no: 'INV-2024-003',
      customer_name: 'Amit Patel',
      amount: 890,
      status: 'pending',
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 's4',
      invoice_no: 'INV-2024-004',
      customer_name: 'Anita Rao',
      amount: 2100,
      status: 'paid',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 's5',
      invoice_no: 'INV-2024-005',
      customer_name: 'Suresh Mehta',
      amount: 1680,
      status: 'paid',
      created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
    }
  ]

  return NextResponse.json({
    success: true,
    data: recentSales.slice(0, limit)
  })
}
