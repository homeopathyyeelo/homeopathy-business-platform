import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'EXP-001', date: '2024-10-01', category: 'Rent', amount: 15000, notes: 'Monthly rent' },
    { id: 'EXP-002', date: '2024-10-02', category: 'Utilities', amount: 3500, notes: 'Electricity bill' },
    { id: 'EXP-003', date: '2024-10-03', category: 'Salaries', amount: 50000, notes: 'Staff salaries' },
  ]
  const summary = {
    total: rows.length,
    totalAmount: rows.reduce((s, r) => s + r.amount, 0),
  }
  return NextResponse.json({ success: true, data: rows, summary })
}

export async function POST(req: Request) {
  const body = await req.json()
  return NextResponse.json({ success: true, id: 'EXP-NEW', message: 'Expense recorded' }, { status: 201 })
}
