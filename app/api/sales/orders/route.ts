import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'SO-1001', customer: 'Rajesh Kumar', date: '2024-10-05', status: 'CONFIRMED', amount: 1250.5 },
    { id: 'SO-1002', customer: 'Amit Patel', date: '2024-10-06', status: 'DRAFT', amount: 9800.0 },
  ]
  const summary = {
    total: rows.length,
    confirmed: rows.filter(r => r.status === 'CONFIRMED').length,
    totalAmount: rows.reduce((s, r) => s + r.amount, 0),
  }
  return NextResponse.json({ success: true, data: rows, summary })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const orderId = `SO-${Date.now()}`
  // TODO: Save to database or proxy to Go API
  return NextResponse.json({ 
    success: true, 
    id: orderId, 
    message: 'Sales order created successfully' 
  }, { status: 201 })
}
