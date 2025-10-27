import { NextRequest, NextResponse } from 'next/server'

const heldBills = [
  { id: 'HOLD-001', customer: 'Walk-in Customer', items: 3, amount: 450.0, heldAt: '2024-10-27T10:30:00Z' },
  { id: 'HOLD-002', customer: 'Rajesh Kumar', items: 5, amount: 1250.0, heldAt: '2024-10-27T11:15:00Z' },
]

export async function GET() {
  const summary = {
    total: heldBills.length,
    totalAmount: heldBills.reduce((s, b) => s + b.amount, 0),
  }
  return NextResponse.json({ success: true, data: heldBills, summary })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const holdId = `HOLD-${Date.now()}`
  
  // TODO: Save held bill to database
  return NextResponse.json({ 
    success: true, 
    id: holdId, 
    message: 'Bill parked successfully' 
  }, { status: 201 })
}
