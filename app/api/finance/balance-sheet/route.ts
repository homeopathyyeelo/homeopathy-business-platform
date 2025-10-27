import { NextResponse } from 'next/server'

export async function GET() {
  const data = {
    assets: {
      currentAssets: {
        cash: 50000,
        bank: 100000,
        inventory: 150000,
        debtors: 25000,
        total: 325000,
      },
      fixedAssets: {
        furniture: 50000,
        equipment: 100000,
        total: 150000,
      },
      totalAssets: 475000,
    },
    liabilities: {
      currentLiabilities: {
        creditors: 100000,
        outstandingExpenses: 10000,
        total: 110000,
      },
      longTermLiabilities: {
        loans: 50000,
        total: 50000,
      },
      totalLiabilities: 160000,
    },
    equity: {
      capital: 300000,
      retainedEarnings: 15000,
      total: 315000,
    },
  }
  return NextResponse.json({ success: true, data })
}
