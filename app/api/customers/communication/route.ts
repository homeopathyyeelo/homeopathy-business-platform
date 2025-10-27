import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'c1', customerId: 1, channel: 'WhatsApp', subject: 'Order update', date: '2024-10-01', status: 'SENT' },
    { id: 'c2', customerId: 3, channel: 'Email', subject: 'Promo', date: '2024-10-02', status: 'SENT' },
  ]
  const summary = {
    total: rows.length,
    sent: rows.filter(r => r.status === 'SENT').length,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
