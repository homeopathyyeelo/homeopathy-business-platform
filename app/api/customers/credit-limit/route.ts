import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { customerId: 1, name: 'Rajesh Kumar', creditLimit: 10000, used: 2500, available: 7500 },
    { customerId: 3, name: 'Amit Patel', creditLimit: 200000, used: 15000, available: 185000 },
  ]
  const summary = {
    customersWithCredit: rows.length,
    totalCreditLimit: rows.reduce((s, r) => s + r.creditLimit, 0),
    totalUsed: rows.reduce((s, r) => s + r.used, 0),
    totalAvailable: rows.reduce((s, r) => s + r.available, 0),
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
