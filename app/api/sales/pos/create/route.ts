import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const invoiceId = `POS-${Date.now()}`
  
  // TODO: Proxy to Go API: POST /api/v1/sales/pos/create
  // Calculate totals, deduct inventory, create invoice
  
  return NextResponse.json({ 
    success: true, 
    id: invoiceId,
    invoiceNumber: invoiceId,
    totalAmount: body.totalAmount || 0,
    message: 'POS billing completed successfully' 
  }, { status: 201 })
}
