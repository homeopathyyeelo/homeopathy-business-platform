import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Mock data as fallback
const mockProducts = [
  { id: '1', name: 'Arnica Montana 30C', category: 'Dilutions', brand: 'SBL', price: 85, stock: 150, mrp: 100, description: 'For injuries and trauma' },
  { id: '2', name: 'Belladonna 200C', category: 'Dilutions', brand: 'Dr. Reckeweg', price: 95, stock: 120, mrp: 110, description: 'For fever and inflammation' },
  { id: '3', name: 'Calendula Q', category: 'Mother Tinctures', brand: 'Willmar Schwabe', price: 180, stock: 80, mrp: 200, description: 'For wounds and cuts' },
  { id: '4', name: 'Calc Phos 6X', category: 'Biochemic', brand: 'BJain', price: 65, stock: 200, mrp: 75, description: 'For bone health' },
]

export async function GET(request: NextRequest) {
  try {
    // Try to get from database first
    try {
      const result = await query('SELECT * FROM products ORDER BY created_at DESC LIMIT 100');
      
      if (result.rows.length > 0) {
        return NextResponse.json({
          success: true,
          data: result.rows,
          count: result.rows.length,
          source: 'database'
        })
      }
    } catch (dbError) {
      console.error('Database query failed, using mock data:', dbError);
    }
    
    // Fallback to mock data
    return NextResponse.json({
      success: true,
      data: mockProducts,
      count: mockProducts.length,
      source: 'mock'
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
    
    // Try to insert into database
    try {
      const result = await query(
        `INSERT INTO products (name, category, brand, price, stock, mrp, description) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [body.name, body.category, body.brand, body.price, body.stock || 0, body.mrp, body.description]
      );
      
      return NextResponse.json({ 
        success: true, 
        data: result.rows[0],
        source: 'database'
      }, { status: 201 })
    } catch (dbError) {
      console.error('Database insert failed:', dbError);
      
      // Return mock response
      const newProduct = {
        id: String(Date.now()),
        ...body,
        stock: body.stock || 0,
        created_at: new Date().toISOString()
      }
      return NextResponse.json({ 
        success: true, 
        data: newProduct,
        source: 'mock'
      }, { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create product" },
      { status: 500 }
    )
  }
}