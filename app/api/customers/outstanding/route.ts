import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { customerId: 2, name: 'Priya Sharma', outstanding: 2000, lastInvoice: '2024-10-03' },
    { customerId: 3, name: 'Amit Patel', outstanding: 15000, lastInvoice: '2024-10-05' },
  ]
  const summary = {
    totalCustomers: rows.length,
    totalOutstanding: rows.reduce((s, r) => s + r.outstanding, 0),
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
