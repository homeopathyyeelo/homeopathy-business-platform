import { NextResponse } from 'next/server'

export async function GET() {
  const types = [
    { id: 'manufacturer', name: 'Manufacturer' },
    { id: 'distributor', name: 'Distributor' },
    { id: 'wholesaler', name: 'Wholesaler' },
    { id: 'retailer', name: 'Retailer' },
  ]
  return NextResponse.json({ success: true, data: types })
}
