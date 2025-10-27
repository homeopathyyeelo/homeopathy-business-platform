import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'f1', customerId: 1, name: 'Rajesh Kumar', rating: 5, comment: 'Great service', date: '2024-10-01' },
    { id: 'f2', customerId: 2, name: 'Priya Sharma', rating: 4, comment: 'Fast delivery', date: '2024-10-02' },
  ]
  const summary = {
    total: rows.length,
    avgRating: rows.reduce((s, r) => s + r.rating, 0) / rows.length,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
