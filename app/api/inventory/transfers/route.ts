import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'TRF-001', product: 'Nux Vomica 30C', fromLocation: 'Main Warehouse', toLocation: 'Retail Counter', qty: 20, date: '2024-10-05', status: 'COMPLETED' },
    { id: 'TRF-002', product: 'Rhus Tox 200C', fromLocation: 'Retail Counter', toLocation: 'Main Warehouse', qty: 5, date: '2024-10-06', status: 'PENDING' },
  ]
  const summary = {
    total: rows.length,
    completed: rows.filter(r => r.status === 'COMPLETED').length,
    pending: rows.filter(r => r.status === 'PENDING').length,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}

export async function POST(req: Request) {
  const body = await req.json()
  return NextResponse.json({ success: true, id: 'TRF-NEW', message: 'Transfer created' }, { status: 201 })
}
