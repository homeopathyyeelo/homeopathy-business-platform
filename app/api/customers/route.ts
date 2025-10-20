import { NextRequest, NextResponse } from "next/server"

// In-memory store
let customers = [
  { id: '1', name: 'Dr. Rajesh Kumar', phone: '9876543210', email: 'rajesh@example.com', address: 'Mumbai', loyaltyPoints: 150 },
  { id: '2', name: 'Priya Sharma', phone: '9876543211', email: 'priya@example.com', address: 'Delhi', loyaltyPoints: 200 },
  { id: '3', name: 'Amit Patel', phone: '9876543212', email: 'amit@example.com', address: 'Ahmedabad', loyaltyPoints: 100 },
]

export async function GET() {
  return NextResponse.json({ success: true, data: customers, count: customers.length })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newCustomer = {
      id: String(customers.length + 1),
      ...body,
      loyaltyPoints: body.loyaltyPoints || 0,
      created_at: new Date().toISOString()
    }
    customers.push(newCustomer)
    return NextResponse.json({ success: true, data: newCustomer }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
