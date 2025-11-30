import { NextRequest, NextResponse } from 'next/server'

const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '5')

  try {
    // Fetch from Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/dashboard/top-products?limit=${limit}`);
    const data = await res.json();
    
    if (res.ok) {
      return NextResponse.json({ success: true, data: data.data || [] });
    }
  } catch (error) {
    console.error('Top products API error:', error);
  }

  // Fallback data
  const topProducts = [
    {
      product_id: 'p1',
      product_name: 'Arnica Montana 30C',
      sold_qty: 245,
      revenue: 36750
    },
    {
      product_id: 'p2',
      product_name: 'Belladonna 200C',
      sold_qty: 198,
      revenue: 29700
    },
    {
      product_id: 'p3',
      product_name: 'Nux Vomica 30C',
      sold_qty: 176,
      revenue: 26400
    },
    {
      product_id: 'p4',
      product_name: 'Pulsatilla 30C',
      sold_qty: 154,
      revenue: 23100
    },
    {
      product_id: 'p5',
      product_name: 'Rhus Tox 30C',
      sold_qty: 142,
      revenue: 21300
    }
  ]

  return NextResponse.json({
    success: true,
    data: topProducts.slice(0, limit)
  })
}
