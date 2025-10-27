import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'ALL'
  
  const rows = [
    { id: 'PMT-001', type: 'PAYMENT', date: '2024-10-01', party: 'SBL Pharmaceuticals', amount: 25000, mode: 'Bank Transfer' },
    { id: 'RCT-001', type: 'RECEIPT', date: '2024-10-02', party: 'Rajesh Kumar', amount: 1250, mode: 'Cash' },
    { id: 'PMT-002', type: 'PAYMENT', date: '2024-10-03', party: 'Rent', amount: 15000, mode: 'Cheque' },
  ]
  
  const filtered = type === 'ALL' ? rows : rows.filter(r => r.type === type)
  
  const summary = {
    total: filtered.length,
    totalAmount: filtered.reduce((s, r) => s + r.amount, 0),
  }
  return NextResponse.json({ success: true, data: filtered, summary })
}

export async function POST(req: Request) {
  const body = await req.json()
  return NextResponse.json({ success: true, id: 'VCH-NEW', message: 'Voucher created' }, { status: 201 })
}
