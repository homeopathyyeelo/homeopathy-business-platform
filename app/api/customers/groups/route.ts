import { NextResponse } from 'next/server'

const groups = [
  { id: 'retail', name: 'Retail', discountPercent: 0 },
  { id: 'wholesale', name: 'Wholesale', discountPercent: 5 },
  { id: 'doctor', name: 'Doctor', discountPercent: 8 },
]

export async function GET() {
  return NextResponse.json({ success: true, data: groups })
}
