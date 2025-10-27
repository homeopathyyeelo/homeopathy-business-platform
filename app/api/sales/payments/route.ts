import { NextRequest, NextResponse } from 'next/server'

const payments = [
  { id: 'PMT-001', invoiceId: 'INV-1001', customer: 'Rajesh Kumar', amount: 1250.5, method: 'CASH', date: '2024-10-27', status: 'COMPLETED' },
  { id: 'PMT-002', invoiceId: 'INV-1002', customer: 'Amit Patel', amount: 5000.0, method: 'UPI', date: '2024-10-27', status: 'COMPLETED' },
]

export async function GET() {
  const summary = {
    total: payments.length,
    totalAmount: payments.reduce((s, p) => s + p.amount, 0),
    completed: payments.filter(p => p.status === 'COMPLETED').length,
  }
  return NextResponse.json({ success: true, data: payments, summary })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const paymentId = `PMT-${Date.now()}`
  
  // TODO: Record payment, update invoice/order status
  return NextResponse.json({ 
    success: true, 
    id: paymentId, 
    message: 'Payment recorded successfully' 
  }, { status: 201 })
}
