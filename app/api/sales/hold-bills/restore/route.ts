import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { holdId } = await req.json()
  
  if (!holdId) {
    return NextResponse.json({ success: false, error: 'Hold ID required' }, { status: 400 })
  }
  
  // TODO: Fetch held bill from database and return for editing
  const restoredBill = {
    id: holdId,
    customer: 'Walk-in Customer',
    items: [
      { productId: 'p1', name: 'Arnica 30C', qty: 2, price: 150, amount: 300 },
      { productId: 'p2', name: 'Belladonna 30C', qty: 1, price: 150, amount: 150 },
    ],
    subtotal: 450,
    tax: 0,
    total: 450,
  }
  
  return NextResponse.json({ success: true, data: restoredBill })
}
