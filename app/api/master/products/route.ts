import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET all products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    
    const conditions: Record<string, any> = {};
    if (isActive !== null) {
      conditions.is_active = isActive === 'true';
    }
    
    const products = await db.getAll('products', Object.keys(conditions).length > 0 ? conditions : undefined);
    
    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', message: error.message },
      { status: 500 }
    );
  }
}

// POST create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate product code if not provided
    if (!body.product_code) {
      const lastProduct = await db.customQuery(
        'SELECT product_code FROM products ORDER BY created_at DESC LIMIT 1'
      );
      const lastCode = lastProduct[0]?.product_code || 'PRD0000';
      const lastNumber = parseInt(lastCode.replace('PRD', ''));
      body.product_code = `PRD${String(lastNumber + 1).padStart(4, '0')}`;
    }
    
    const newProduct = await db.insert('products', body);
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', message: error.message },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const updatedProduct = await db.update('products', id, updateData);
    
    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const deletedProduct = await db.delete('products', id);
    
    return NextResponse.json(deletedProduct, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', message: error.message },
      { status: 500 }
    );
  }
}
