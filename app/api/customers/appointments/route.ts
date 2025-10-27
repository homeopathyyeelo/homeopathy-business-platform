import { NextResponse } from 'next/server'

export async function GET() {
  const rows = [
    { id: 'a1', customerId: 4, name: 'Dr. Sunita Verma', date: '2024-10-10', time: '11:30', purpose: 'Consultation', status: 'SCHEDULED' },
    { id: 'a2', customerId: 1, name: 'Rajesh Kumar', date: '2024-10-12', time: '16:00', purpose: 'Follow-up', status: 'CONFIRMED' },
  ]
  const summary = {
    total: rows.length,
    scheduled: rows.filter(r => r.status === 'SCHEDULED').length,
  }
  return NextResponse.json({ success: true, data: rows, summary })
}
