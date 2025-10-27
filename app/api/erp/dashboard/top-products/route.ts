import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '5')

  // TODO: Fetch from database
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
