import { NextRequest, NextResponse } from "next/server"

// In-memory store (replace with database later)
let products = [
  { id: '1', name: 'Arnica Montana 30C', category: 'Dilutions', brand: 'SBL', price: 85, stock: 150, mrp: 100, description: 'For injuries and trauma' },
  { id: '2', name: 'Belladonna 200C', category: 'Dilutions', brand: 'Dr. Reckeweg', price: 95, stock: 120, mrp: 110, description: 'For fever and inflammation' },
  { id: '3', name: 'Calendula Q', category: 'Mother Tinctures', brand: 'Willmar Schwabe', price: 180, stock: 80, mrp: 200, description: 'For wounds and cuts' },
  { id: '4', name: 'Calc Phos 6X', category: 'Biochemic', brand: 'BJain', price: 65, stock: 200, mrp: 75, description: 'For bone health' },
]

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch products" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newProduct = {
      id: String(products.length + 1),
      ...body,
      stock: body.stock || 0,
      created_at: new Date().toISOString()
    }
    products.push(newProduct)
    return NextResponse.json({ success: true, data: newProduct }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create product" },
      { status: 500 }
    )
  }
}