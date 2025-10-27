import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'REC-001', product: 'Arnica 30C', systemQty: 100, physicalQty: 98, variance: -2, date: '2024-10-05', status: 'PENDING' },
    { id: 'REC-002', product: 'Belladonna 200C', systemQty: 50, physicalQty: 50, variance: 0, date: '2024-10-06', status: 'RECONCILED' },
  ]
  const summary = {
    total: rows.length,
    pending: rows.filter(r => r.status === 'PENDING').length,
    reconciled: rows.filter(r => r.status === 'RECONCILED').length,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}

export async function POST(req: Request) {
  const body = await req.json()
  return NextResponse.json({ success: true, id: 'REC-NEW', message: 'Reconciliation saved' }, { status: 201 })
}
