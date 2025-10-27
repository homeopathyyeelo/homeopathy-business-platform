import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { account: 'Cash', debit: 50000, credit: 0 },
    { account: 'Bank', debit: 100000, credit: 0 },
    { account: 'Sales', debit: 0, credit: 200000 },
    { account: 'Purchases', debit: 120000, credit: 0 },
    { account: 'Expenses', debit: 30000, credit: 0 },
  ]
  const summary = {
    totalDebit: rows.reduce((s, r) => s + r.debit, 0),
    totalCredit: rows.reduce((s, r) => s + r.credit, 0),
    difference: Math.abs(rows.reduce((s, r) => s + r.debit - r.credit, 0)),
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
