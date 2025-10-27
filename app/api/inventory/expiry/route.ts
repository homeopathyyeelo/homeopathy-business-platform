import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'b1', product: 'Arnica 30C', batch: 'B2024-001', expiryDate: '2024-12-31', qty: 50, status: 'EXPIRING_SOON' },
    { id: 'b2', product: 'Belladonna 200C', batch: 'B2024-002', expiryDate: '2025-06-30', qty: 100, status: 'OK' },
  ]
  const summary = {
    total: rows.length,
    expiringSoon: rows.filter(r => r.status === 'EXPIRING_SOON').length,
    expired: rows.filter(r => r.status === 'EXPIRED').length,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
