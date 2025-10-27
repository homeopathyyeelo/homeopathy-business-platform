import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'BB-001', date: '2024-10-01', particulars: 'Customer Payment', debit: 25000, credit: 0, balance: 25000 },
    { id: 'BB-002', date: '2024-10-02', particulars: 'Vendor Payment', debit: 0, credit: 50000, balance: -25000 },
    { id: 'BB-003', date: '2024-10-03', particulars: 'Customer Payment', debit: 30000, credit: 0, balance: 5000 },
  ]
  const summary = {
    totalDebit: rows.reduce((s, r) => s + r.debit, 0),
    totalCredit: rows.reduce((s, r) => s + r.credit, 0),
    closingBalance: rows[rows.length - 1]?.balance || 0,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
