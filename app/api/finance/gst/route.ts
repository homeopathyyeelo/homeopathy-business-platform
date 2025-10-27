import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { month: 'Oct 2024', sales: 100000, purchases: 75000, outputGST: 12000, inputGST: 9000, netGST: 3000, status: 'PENDING' },
    { month: 'Sep 2024', sales: 95000, purchases: 70000, outputGST: 11400, inputGST: 8400, netGST: 3000, status: 'FILED' },
  ]
  const summary = {
    totalOutputGST: rows.reduce((s, r) => s + r.outputGST, 0),
    totalInputGST: rows.reduce((s, r) => s + r.inputGST, 0),
    totalNetGST: rows.reduce((s, r) => s + r.netGST, 0),
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
