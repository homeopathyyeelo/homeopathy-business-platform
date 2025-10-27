import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'PC-001', date: '2024-10-01', particulars: 'Office supplies', amount: 500, balance: 9500 },
    { id: 'PC-002', date: '2024-10-02', particulars: 'Tea/Coffee', amount: 200, balance: 9300 },
    { id: 'PC-003', date: '2024-10-03', particulars: 'Courier', amount: 150, balance: 9150 },
  ]
  const summary = {
    openingBalance: 10000,
    totalSpent: rows.reduce((s, r) => s + r.amount, 0),
    closingBalance: rows[rows.length - 1]?.balance || 0,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
