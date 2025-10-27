import { NextResponse } from 'next/server'

export async function GET() {
  const data = {
    revenue: {
      sales: 200000,
      otherIncome: 5000,
      total: 205000,
    },
    expenses: {
      purchases: 120000,
      salaries: 50000,
      rent: 15000,
      utilities: 3500,
      other: 5000,
      total: 193500,
    },
    netProfit: 11500,
  }
  return NextResponse.json({ success: true, data })
}
