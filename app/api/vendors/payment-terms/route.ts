import { NextResponse } from 'next/server'

export async function GET() {
  const terms = [
    { id: 'net7', name: 'Net 7 days', days: 7 },
    { id: 'net15', name: 'Net 15 days', days: 15 },
    { id: 'net30', name: 'Net 30 days', days: 30 },
    { id: 'advance', name: 'Advance Payment', days: 0 },
  ]
  return NextResponse.json({ success: true, data: terms })
}
