import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'BR-001', date: '2024-10-01', particulars: 'Customer Payment', bookBalance: 25000, bankBalance: 25000, status: 'MATCHED' },
    { id: 'BR-002', date: '2024-10-02', particulars: 'Vendor Payment', bookBalance: 50000, bankBalance: 0, status: 'UNMATCHED' },
    { id: 'BR-003', date: '2024-10-03', particulars: 'Bank Charges', bookBalance: 0, bankBalance: 500, status: 'UNMATCHED' },
  ]
  const summary = {
    bookBalance: 100000,
    bankBalance: 99500,
    difference: 500,
    matched: rows.filter(r => r.status === 'MATCHED').length,
    unmatched: rows.filter(r => r.status === 'UNMATCHED').length,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
