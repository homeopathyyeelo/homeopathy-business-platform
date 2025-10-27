import { NextResponse } from 'next/server'

export async function GET() {
  const suggestions = [
    { product: 'Arnica 30C', currentStock: 10, reorderLevel: 20, suggestedQty: 50, reason: 'Low stock + high demand' },
    { product: 'Belladonna 200C', currentStock: 5, reorderLevel: 15, suggestedQty: 30, reason: 'Below reorder level' },
  ]
  const summary = {
    totalSuggestions: suggestions.length,
    totalQtyToOrder: suggestions.reduce((s, r) => s + r.suggestedQty, 0),
  }
  return NextResponse.json({ success: true, data: suggestions, summary })
}
