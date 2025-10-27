import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'PL-001', vendor: 'SBL Pharmaceuticals', invoiceNo: 'PI-2001', date: '2024-10-01', debit: 0, credit: 50000, balance: -50000 },
    { id: 'PL-002', vendor: 'Dr. Reckeweg', invoiceNo: 'PI-2002', date: '2024-10-02', debit: 0, credit: 75000, balance: -125000 },
    { id: 'PL-003', vendor: 'SBL Pharmaceuticals', invoiceNo: 'PMT-101', date: '2024-10-03', debit: 25000, credit: 0, balance: -100000 },
  ]
  const summary = {
    totalDebit: rows.reduce((s, r) => s + r.debit, 0),
    totalCredit: rows.reduce((s, r) => s + r.credit, 0),
    closingBalance: rows[rows.length - 1]?.balance || 0,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
