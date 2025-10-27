import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'SL-001', customer: 'Rajesh Kumar', invoiceNo: 'INV-1001', date: '2024-10-01', debit: 1250.5, credit: 0, balance: 1250.5 },
    { id: 'SL-002', customer: 'Amit Patel', invoiceNo: 'INV-1002', date: '2024-10-02', debit: 9800.0, credit: 0, balance: 11050.5 },
    { id: 'SL-003', customer: 'Rajesh Kumar', invoiceNo: 'PMT-001', date: '2024-10-03', debit: 0, credit: 1250.5, balance: 9800.0 },
  ]
  const summary = {
    totalDebit: rows.reduce((s, r) => s + r.debit, 0),
    totalCredit: rows.reduce((s, r) => s + r.credit, 0),
    closingBalance: rows[rows.length - 1]?.balance || 0,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
