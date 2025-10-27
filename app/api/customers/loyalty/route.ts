import { NextResponse } from 'next/server'

export async function GET() {
  const data = [
    { customerId: 1, points: 250, lastEarnedAt: '2024-10-01T10:00:00Z' },
    { customerId: 2, points: 180, lastEarnedAt: '2024-10-02T12:00:00Z' },
    { customerId: 3, points: 1500, lastEarnedAt: '2024-10-03T15:30:00Z' },
  ]
  const summary = {
    totalCustomers: data.length,
    totalPoints: data.reduce((s, r) => s + r.points, 0),
  }
  return NextResponse.json({ success: true, data, summary })
}
