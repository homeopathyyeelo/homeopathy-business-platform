import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'ADJ-001', product: 'Arnica 30C', type: 'IN', qty: 10, reason: 'Stock correction', date: '2024-10-05' },
    { id: 'ADJ-002', product: 'Belladonna 200C', type: 'OUT', qty: 5, reason: 'Damaged', date: '2024-10-06' },
  ]
  const summary = {
    total: rows.length,
    in: rows.filter(r => r.type === 'IN').length,
    out: rows.filter(r => r.type === 'OUT').length,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}

export async function POST(req: Request) {
  const body = await req.json()
  return NextResponse.json({ success: true, id: 'ADJ-NEW', message: 'Adjustment created' }, { status: 201 })
}
