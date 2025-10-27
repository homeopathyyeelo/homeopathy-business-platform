import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'CB-001', date: '2024-10-01', particulars: 'Cash Sales', debit: 5000, credit: 0, balance: 5000 },
    { id: 'CB-002', date: '2024-10-02', particulars: 'Rent Payment', debit: 0, credit: 15000, balance: -10000 },
    { id: 'CB-003', date: '2024-10-03', particulars: 'Cash Sales', debit: 12000, credit: 0, balance: 2000 },
  ]
  const summary = {
    totalDebit: rows.reduce((s, r) => s + r.debit, 0),
    totalCredit: rows.reduce((s, r) => s + r.credit, 0),
    closingBalance: rows[rows.length - 1]?.balance || 0,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
