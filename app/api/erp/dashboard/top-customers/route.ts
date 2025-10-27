import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '5')

  // TODO: Fetch from database
  const topCustomers = [
    {
      customer_id: 'c1',
      customer_name: 'Rajesh Kumar',
      total_purchases: 15,
      total_spent: 45600,
      last_purchase: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      customer_id: 'c2',
      customer_name: 'Priya Sharma',
      total_purchases: 12,
      total_spent: 38900,
      last_purchase: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      customer_id: 'c3',
      customer_name: 'Amit Patel',
      total_purchases: 10,
      total_spent: 32400,
      last_purchase: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      customer_id: 'c4',
      customer_name: 'Anita Rao',
      total_purchases: 9,
      total_spent: 28700,
      last_purchase: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      customer_id: 'c5',
      customer_name: 'Suresh Mehta',
      total_purchases: 8,
      total_spent: 25100,
      last_purchase: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  return NextResponse.json({
    success: true,
    data: topCustomers.slice(0, limit)
  })
}
