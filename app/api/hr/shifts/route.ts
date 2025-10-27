import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Replace with proxy to Go API once HR endpoints are exposed
  const data = [
    { id: 'shift-1', name: 'Morning', start: '09:00', end: '17:00' },
    { id: 'shift-2', name: 'Evening', start: '13:00', end: '21:00' },
  ]
  return NextResponse.json(data)
}
