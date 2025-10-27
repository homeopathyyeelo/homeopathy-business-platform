import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { product: 'Arnica 30C', qty: 100, unitCost: 50, totalValue: 5000 },
    { product: 'Belladonna 200C', qty: 50, unitCost: 60, totalValue: 3000 },
    { product: 'Nux Vomica 30C', qty: 75, unitCost: 55, totalValue: 4125 },
  ]
  const summary = {
    totalProducts: rows.length,
    totalQty: rows.reduce((s, r) => s + r.qty, 0),
    totalValue: rows.reduce((s, r) => s + r.totalValue, 0),
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
